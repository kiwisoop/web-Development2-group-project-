package com.sport.web_sport.esports.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sport.web_sport.esports.dto.RiotMatchDetail;
import com.sport.web_sport.esports.dto.RiotMatchSummary;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
public class RiotApiProxyService {

    private static final String BASE_URL  = "https://esports-api.lolesports.com/persisted/gw";
    private static final String LEAGUE_ID = "98767991310872058";

    @Value("${riot.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper  = new ObjectMapper();

    // Simple 30-minute in-memory cache
    private final AtomicReference<List<RiotMatchSummary>> cachedSchedule = new AtomicReference<>();
    private final AtomicLong cacheTime = new AtomicLong(0L);

    // ── Season boundary ─────────────────────────────────────────────────────────
    private static String detectSeason(String startTime) {
        LocalDate d = Instant.parse(startTime).atZone(ZoneOffset.UTC).toLocalDate();
        int y = d.getYear();
        int m = d.getMonthValue();
        if (y == 2025 && m <= 6)  return "2025 Spring";
        if (y == 2025 && m >= 7)  return "2025 Summer";
        if (y == 2026 && m <= 3)  return "2026 Spring";
        return null; // 2026 Summer (April+) → excluded
    }

    // ── Schedule (cached) ────────────────────────────────────────────────────────
    public List<RiotMatchSummary> fetchSchedule() {
        long now = System.currentTimeMillis();
        if (cachedSchedule.get() != null && now - cacheTime.get() < 30 * 60 * 1000L) {
            return cachedSchedule.get();
        }

        List<RiotMatchSummary> all = new ArrayList<>();
        String pageToken = null;
        int maxPages = 5;

        for (int p = 0; p < maxPages; p++) {
            String url = BASE_URL + "/getSchedule?hl=ko-KR&leagueId=" + LEAGUE_ID;
            if (pageToken != null) url += "&pageToken=" + pageToken;

            try {
                ResponseEntity<String> resp = restTemplate.exchange(
                        url, HttpMethod.GET, buildRequest(), String.class);

                JsonNode root   = objectMapper.readTree(resp.getBody());
                JsonNode events = root.path("data").path("schedule").path("events");
                JsonNode pages  = root.path("data").path("schedule").path("pages");

                boolean hasOlderData = false;
                for (JsonNode ev : events) {
                    if (!"match".equals(ev.path("type").asText())) continue;
                    String time = ev.path("startTime").asText();
                    String season = detectSeason(time);
                    if (season == null) continue; // exclude 2026 Summer

                    JsonNode matchNode = ev.path("match");
                    List<RiotMatchSummary.RiotTeamInfo> teams = parseTeams(matchNode.path("teams"));

                    all.add(new RiotMatchSummary(
                            matchNode.path("id").asText(),
                            time,
                            ev.path("state").asText(),
                            ev.path("blockName").asText(),
                            season,
                            teams
                    ));
                    hasOlderData = true;
                }

                JsonNode olderNode = pages.path("older");
                if (olderNode.isNull() || olderNode.isMissingNode() || !hasOlderData) break;
                pageToken = olderNode.asText();

                // Stop once we have 2025 Spring data (early 2025 = old enough)
                boolean has2025Spring = all.stream().anyMatch(m -> "2025 Spring".equals(m.season()));
                boolean has2025Summer = all.stream().anyMatch(m -> "2025 Summer".equals(m.season()));
                if (has2025Spring && has2025Summer && p >= 2) break;

            } catch (Exception e) {
                log.error("Riot API schedule error: {}", e.getMessage());
                break;
            }
        }

        // Newest first
        all.sort(Comparator.comparing(RiotMatchSummary::startTime).reversed());

        cachedSchedule.set(all);
        cacheTime.set(now);
        return all;
    }

    // ── Match detail ─────────────────────────────────────────────────────────────
    public RiotMatchDetail fetchMatchDetail(String matchId) {
        String url = BASE_URL + "/getEventDetails?hl=ko-KR&id=" + matchId;
        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                    url, HttpMethod.GET, buildRequest(), String.class);

            JsonNode root  = objectMapper.readTree(resp.getBody());
            JsonNode event = root.path("data").path("event");
            JsonNode match = event.path("match");

            // Build team map by ID
            Map<String, String> teamIdToName = new HashMap<>();
            Map<String, String> teamIdToCode = new HashMap<>();
            for (JsonNode t : match.path("teams")) {
                teamIdToName.put(t.path("id").asText(), t.path("name").asText());
                teamIdToCode.put(t.path("id").asText(), t.path("code").asText());
            }

            // Determine winner per game by gameWins after each game
            // (We can only tell per-game result from the "result" field on teams for completed matches)
            // For per-game result we look at game state and which team was on blue side
            List<RiotMatchDetail.RiotGameInfo> games = new ArrayList<>();
            JsonNode gamesNode = match.path("games");

            // Compute per-game winner from running gameWins delta
            int[] prevWins = {0, 0}; // [team0, team1]
            for (JsonNode g : gamesNode) {
                String gId    = g.path("id").asText();
                int    gNum   = g.path("number").asInt();
                String gState = g.path("state").asText();

                String blueId = "", redId = "";
                for (JsonNode gt : g.path("teams")) {
                    if ("blue".equals(gt.path("side").asText())) blueId = gt.path("id").asText();
                    else                                          redId  = gt.path("id").asText();
                }

                // Determine winner: look at cumulative result on teams node
                String winner = "";
                if ("completed".equals(gState) && !match.path("teams").isEmpty()) {
                    JsonNode t0 = match.path("teams").get(0);
                    JsonNode t1 = match.path("teams").get(1);
                    int w0 = t0 == null ? 0 : t0.path("result").path("gameWins").asInt(0);
                    int w1 = t1 == null ? 0 : t1.path("result").path("gameWins").asInt(0);
                    String id0 = t0 == null ? "" : t0.path("id").asText();
                    String id1 = t1 == null ? "" : t1.path("id").asText();
                    // Delta per game is hard to know; use blue/red side as proxy if only 1 game
                    // For simplicity: winner determined by teams' overall wins is not per-game accurate
                    // We'll leave winner empty and just show blue/red for now
                }

                games.add(new RiotMatchDetail.RiotGameInfo(
                        gId, gNum, gState,
                        teamIdToName.getOrDefault(blueId, blueId),
                        teamIdToCode.getOrDefault(blueId, blueId),
                        teamIdToName.getOrDefault(redId, redId),
                        teamIdToCode.getOrDefault(redId, redId),
                        winner
                ));
            }

            List<RiotMatchSummary.RiotTeamInfo> teams = parseTeams(match.path("teams"));

            // Find the first event time (use schedule cache if available)
            String startTime = "", state = "", blockName = "", season = "";
            List<RiotMatchSummary> cached = cachedSchedule.get();
            if (cached != null) {
                for (RiotMatchSummary m : cached) {
                    if (m.id().equals(matchId)) {
                        startTime = m.startTime();
                        state     = m.state();
                        blockName = m.blockName();
                        season    = m.season();
                        break;
                    }
                }
            }

            return new RiotMatchDetail(matchId, startTime, state, blockName, season, teams, games);

        } catch (Exception e) {
            log.error("Riot API event detail error ({}): {}", matchId, e.getMessage());
            return null;
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────
    private HttpEntity<Void> buildRequest() {
        HttpHeaders h = new HttpHeaders();
        h.set("x-api-key", apiKey);
        return new HttpEntity<>(h);
    }

    private List<RiotMatchSummary.RiotTeamInfo> parseTeams(JsonNode teamsNode) {
        List<RiotMatchSummary.RiotTeamInfo> list = new ArrayList<>();
        for (JsonNode t : teamsNode) {
            list.add(new RiotMatchSummary.RiotTeamInfo(
                    t.path("name").asText(),
                    t.path("code").asText(),
                    t.path("image").asText(),
                    t.path("result").path("gameWins").asInt(0)
            ));
        }
        return list;
    }
}
