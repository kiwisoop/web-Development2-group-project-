package com.team.sportsanalysis.mlb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

// Parses raw MLB schedule JSON into our flat MlbGame DTOs.
@Service
public class MlbService {

    private final MlbClient client;
    private final ObjectMapper mapper = new ObjectMapper();

    public MlbService(MlbClient client) {
        this.client = client;
    }

    public List<MlbGame> getSchedule(String date) {
        String json = client.fetchScheduleJson(date);
        return parseSchedule(json);
    }

    public List<MlbGame> getMonthSchedule(int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        String json = client.fetchScheduleRangeJson(start.toString(), end.toString());
        return parseSchedule(json);
    }

    private List<MlbGame> parseSchedule(String json) {
        List<MlbGame> result = new ArrayList<>();
        if (json == null || json.isBlank()) return result;

        try {
            JsonNode root = mapper.readTree(json);
            JsonNode dates = root.path("dates");
            for (JsonNode d : dates) {
                for (JsonNode g : d.path("games")) {
                    JsonNode teams = g.path("teams");
                    JsonNode home = teams.path("home");
                    JsonNode away = teams.path("away");

                    result.add(MlbGame.builder()
                            .gamePk(g.path("gamePk").asLong())
                            .gameDate(g.path("gameDate").asText(null))
                            .homeTeam(home.path("team").path("name").asText(null))
                            .awayTeam(away.path("team").path("name").asText(null))
                            .homeTeamId(optLong(home.path("team").path("id")))
                            .awayTeamId(optLong(away.path("team").path("id")))
                            .homeScore(home.has("score") ? home.get("score").asInt() : null)
                            .awayScore(away.has("score") ? away.get("score").asInt() : null)
                            .venue(g.path("venue").path("name").asText(null))
                            .status(g.path("status").path("detailedState").asText(null))
                            .build());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse MLB schedule: " + e.getMessage(), e);
        }
        return result;
    }

    private Long optLong(JsonNode n) {
        if (n == null || n.isMissingNode() || n.isNull()) return null;
        if (n.isNumber()) return n.asLong();
        if (n.isTextual()) {
            try { return Long.parseLong(n.asText()); } catch (Exception ignored) { return null; }
        }
        return null;
    }

    public MlbGameDetail getGameDetail(long gamePk) {
        String json = client.fetchLiveFeedJson(gamePk);
        if (json == null || json.isBlank()) {
            return MlbGameDetail.builder().gamePk(gamePk).build();
        }
        try {
            JsonNode root = mapper.readTree(json);
            JsonNode gameData = root.path("gameData");
            JsonNode liveData = root.path("liveData");
            JsonNode teams = gameData.path("teams");
            JsonNode linescore = liveData.path("linescore");
            JsonNode boxscore = liveData.path("boxscore");

            String homeTeam = teams.path("home").path("name").asText(null);
            String awayTeam = teams.path("away").path("name").asText(null);

            JsonNode lsTeams = linescore.path("teams");
            Integer homeScore = optInt(lsTeams.path("home").path("runs"));
            Integer awayScore = optInt(lsTeams.path("away").path("runs"));
            Integer homeHits = optInt(lsTeams.path("home").path("hits"));
            Integer awayHits = optInt(lsTeams.path("away").path("hits"));
            Integer homeErrors = optInt(lsTeams.path("home").path("errors"));
            Integer awayErrors = optInt(lsTeams.path("away").path("errors"));

            // boxscore fallback for hits/errors if linescore lacked them
            JsonNode bxHome = boxscore.path("teams").path("home").path("teamStats").path("batting");
            JsonNode bxAway = boxscore.path("teams").path("away").path("teamStats").path("batting");
            JsonNode bxHomeFld = boxscore.path("teams").path("home").path("teamStats").path("fielding");
            JsonNode bxAwayFld = boxscore.path("teams").path("away").path("teamStats").path("fielding");
            if (homeHits == null) homeHits = optInt(bxHome.path("hits"));
            if (awayHits == null) awayHits = optInt(bxAway.path("hits"));
            if (homeErrors == null) homeErrors = optInt(bxHomeFld.path("errors"));
            if (awayErrors == null) awayErrors = optInt(bxAwayFld.path("errors"));

            List<MlbInningScore> innings = new ArrayList<>();
            for (JsonNode inn : linescore.path("innings")) {
                innings.add(MlbInningScore.builder()
                        .inning(optInt(inn.path("num")))
                        .awayRuns(optInt(inn.path("away").path("runs")))
                        .homeRuns(optInt(inn.path("home").path("runs")))
                        .build());
            }

            List<MlbGameEvent> events = new ArrayList<>();
            JsonNode allPlays = liveData.path("plays").path("allPlays");
            JsonNode scoringIdx = liveData.path("plays").path("scoringPlays");
            // Prefer scoringPlays index, else fall back to last 10 plays.
            if (scoringIdx.isArray() && scoringIdx.size() > 0 && allPlays.isArray()) {
                for (JsonNode idxNode : scoringIdx) {
                    int i = idxNode.asInt(-1);
                    if (i >= 0 && i < allPlays.size()) {
                        events.add(toEvent(allPlays.get(i)));
                    }
                }
            } else if (allPlays.isArray()) {
                int total = allPlays.size();
                int from = Math.max(0, total - 10);
                for (int i = from; i < total; i++) {
                    events.add(toEvent(allPlays.get(i)));
                }
            }

            return MlbGameDetail.builder()
                    .gamePk(gamePk)
                    .gameDate(gameData.path("datetime").path("dateTime").asText(null))
                    .status(gameData.path("status").path("detailedState").asText(null))
                    .venue(gameData.path("venue").path("name").asText(null))
                    .homeTeam(homeTeam)
                    .awayTeam(awayTeam)
                    .homeScore(homeScore)
                    .awayScore(awayScore)
                    .currentInning(optInt(linescore.path("currentInning")))
                    .inningHalf(linescore.path("inningHalf").asText(null))
                    .awayHits(awayHits)
                    .homeHits(homeHits)
                    .awayErrors(awayErrors)
                    .homeErrors(homeErrors)
                    .innings(innings)
                    .events(events)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse MLB live feed: " + e.getMessage(), e);
        }
    }

    private MlbGameEvent toEvent(JsonNode play) {
        JsonNode about = play.path("about");
        JsonNode result = play.path("result");
        return MlbGameEvent.builder()
                .inning(optInt(about.path("inning")))
                .halfInning(about.path("halfInning").asText(null))
                .description(result.path("description").asText(null))
                .awayScore(optInt(result.path("awayScore")))
                .homeScore(optInt(result.path("homeScore")))
                .scoringPlay(about.has("isScoringPlay") ? about.get("isScoringPlay").asBoolean() : null)
                .build();
    }

    private Integer optInt(JsonNode n) {
        if (n == null || n.isMissingNode() || n.isNull()) return null;
        if (n.isInt() || n.isLong() || n.isShort()) return n.asInt();
        if (n.isTextual()) {
            try { return Integer.parseInt(n.asText()); } catch (Exception ignored) { return null; }
        }
        if (n.isNumber()) return n.asInt();
        return null;
    }
}
