package com.sport.web_sport.baseball.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.sport.web_sport.baseball.dto.MlbSyncRequest;
import com.sport.web_sport.baseball.dto.MlbSyncResultResponse;
import com.sport.web_sport.baseball.service.MlbApiService;
import com.sport.web_sport.baseball.service.MlbSyncService;
import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/mlb")
@RequiredArgsConstructor
public class MlbSyncController {

    private final MlbSyncService mlbSyncService;
    private final MlbApiService mlbApiService;
    private final AuthService authService;

    @PostMapping("/sync/schedule")
    public ApiResponse<MlbSyncResultResponse> syncSchedule(
            @Valid @RequestBody MlbSyncRequest request,
            HttpSession session) {
        authService.requireAdmin(session);
        return ApiResponse.ok(mlbSyncService.sync(request));
    }

    @GetMapping("/test-detail/{gamePk}")
    public ApiResponse<Map<String, Object>> testDetail(
            @PathVariable long gamePk,
            HttpSession session) {
        authService.requireAdmin(session);

        JsonNode feed = mlbApiService.fetchGameFeedLive(gamePk);
        JsonNode boxscore = mlbApiService.fetchGameBoxscore(gamePk);
        JsonNode linescore = mlbApiService.fetchGameLinescore(gamePk);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("gamePk", gamePk);

        // --- feed/live ---
        if (feed != null) {
            JsonNode gameData = feed.path("gameData");
            result.put("gameStatus", gameData.path("status").path("detailedState").asText());

            // probable pitchers
            JsonNode probPitchers = gameData.path("probablePitchers");
            Map<String, String> pitcherNames = new LinkedHashMap<>();
            pitcherNames.put("home", probPitchers.path("home").path("fullName").asText("N/A"));
            pitcherNames.put("away", probPitchers.path("away").path("fullName").asText("N/A"));
            result.put("probablePitchers", pitcherNames);

            // play count + pitchData check
            JsonNode allPlays = feed.path("liveData").path("plays").path("allPlays");
            result.put("playCount", allPlays.isArray() ? allPlays.size() : 0);

            boolean hasPitchData = false;
            if (allPlays.isArray()) {
                outer:
                for (JsonNode play : allPlays) {
                    for (JsonNode event : play.path("playEvents")) {
                        if (event.has("pitchData")) { hasPitchData = true; break outer; }
                    }
                }
            }
            result.put("pitchDataExists", hasPitchData);
        }

        // --- linescore ---
        if (linescore != null) {
            Map<String, Object> ls = new LinkedHashMap<>();
            ls.put("currentInning", linescore.path("currentInning").asInt());
            ls.put("currentInningOrdinal", linescore.path("currentInningOrdinal").asText());
            ls.put("inningCount", linescore.path("innings").isArray() ? linescore.path("innings").size() : 0);

            JsonNode lsTeams = linescore.path("teams");
            ls.put("home", rhe(lsTeams.path("home")));
            ls.put("away", rhe(lsTeams.path("away")));
            result.put("linescore", ls);
        }

        // --- boxscore ---
        if (boxscore != null) {
            JsonNode bsTeams = boxscore.path("teams");

            result.put("homeLineupCount", bsTeams.path("home").path("batters").isArray()
                    ? bsTeams.path("home").path("batters").size() : 0);
            result.put("awayLineupCount", bsTeams.path("away").path("batters").isArray()
                    ? bsTeams.path("away").path("batters").size() : 0);

            Map<String, Object> pitcherCounts = new LinkedHashMap<>();
            pitcherCounts.put("home", bsTeams.path("home").path("pitchers").isArray()
                    ? bsTeams.path("home").path("pitchers").size() : 0);
            pitcherCounts.put("away", bsTeams.path("away").path("pitchers").isArray()
                    ? bsTeams.path("away").path("pitchers").size() : 0);
            result.put("pitcherCounts", pitcherCounts);

            result.put("sampleBatterStatFields", sampleStatFields(bsTeams.path("home"), "batters", "batting"));
            result.put("samplePitcherStatFields", sampleStatFields(bsTeams.path("home"), "pitchers", "pitching"));
        }

        return ApiResponse.ok(result);
    }

    @GetMapping("/test-pitches/{gamePk}")
    public ApiResponse<Map<String, Object>> testPitches(
            @PathVariable long gamePk,
            HttpSession session) {
        authService.requireAdmin(session);

        JsonNode feed = mlbApiService.fetchGameFeedLive(gamePk);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("gamePk", gamePk);

        if (feed == null) {
            result.put("error", "feed/live returned null");
            return ApiResponse.ok(result);
        }

        JsonNode allPlays = feed.path("liveData").path("plays").path("allPlays");
        int totalPlays = allPlays.isArray() ? allPlays.size() : 0;
        int totalPitches = 0;
        int pitchesWithCoords = 0;
        List<Map<String, Object>> samples = new ArrayList<>();

        if (allPlays.isArray()) {
            for (JsonNode play : allPlays) {
                int inning = play.path("about").path("inning").asInt();
                String halfInning = play.path("about").path("halfInning").asText();
                String batterName = play.path("matchup").path("batter").path("fullName").asText();
                String pitcherName = play.path("matchup").path("pitcher").path("fullName").asText();

                for (JsonNode event : play.path("playEvents")) {
                    if (!"pitch".equals(event.path("type").asText())) continue;
                    totalPitches++;

                    JsonNode pd = event.path("pitchData");
                    JsonNode coords = pd.path("coordinates");
                    JsonNode details = event.path("details");

                    boolean hasCoords = !coords.isMissingNode() && !coords.isEmpty()
                            && (coords.has("pX") || coords.has("x"));
                    if (hasCoords) pitchesWithCoords++;

                    if (hasCoords && samples.size() < 50) {
                        Map<String, Object> s = new LinkedHashMap<>();
                        s.put("inning", inning);
                        s.put("halfInning", halfInning);
                        s.put("batterName", batterName);
                        s.put("pitcherName", pitcherName);
                        s.put("pitchType", details.path("type").path("description").asText(null));
                        s.put("pitchDescription", details.path("description").asText(null));
                        s.put("callDescription", details.path("call").path("description").asText(null));
                        s.put("isBall", details.path("isBall").asBoolean(false));
                        s.put("isStrike", details.path("isStrike").asBoolean(false));
                        s.put("isInPlay", details.path("isInPlay").asBoolean(false));
                        s.put("zone", pd.has("zone") ? pd.path("zone").asInt() : null);
                        s.put("strikeZoneTop", pd.has("strikeZoneTop") ? pd.path("strikeZoneTop").asDouble() : null);
                        s.put("strikeZoneBottom", pd.has("strikeZoneBottom") ? pd.path("strikeZoneBottom").asDouble() : null);
                        s.put("coordinatesPresent", true);
                        s.put("x", coords.has("x") ? coords.path("x").asDouble() : null);
                        s.put("y", coords.has("y") ? coords.path("y").asDouble() : null);
                        s.put("plateX", coords.has("pX") ? coords.path("pX").asDouble() : null);
                        s.put("plateZ", coords.has("pZ") ? coords.path("pZ").asDouble() : null);
                        s.put("startSpeed", pd.has("startSpeed") ? pd.path("startSpeed").asDouble() : null);
                        s.put("endSpeed", pd.has("endSpeed") ? pd.path("endSpeed").asDouble() : null);
                        samples.add(s);
                    }
                }
            }
        }

        result.put("totalPlays", totalPlays);
        result.put("totalPitches", totalPitches);
        result.put("pitchesWithCoordinates", pitchesWithCoords);
        result.put("samplePitches", samples);
        return ApiResponse.ok(result);
    }

    private Map<String, Object> rhe(JsonNode node) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("runs", node.path("runs").asInt());
        m.put("hits", node.path("hits").asInt());
        m.put("errors", node.path("errors").asInt());
        return m;
    }

    private List<String> sampleStatFields(JsonNode teamNode, String rosterKey, String statKey) {
        List<String> fields = new ArrayList<>();
        JsonNode roster = teamNode.path(rosterKey);
        if (!roster.isArray() || roster.size() == 0) return fields;
        int playerId = roster.get(0).asInt();
        JsonNode player = teamNode.path("players").path("ID" + playerId);
        if (player.isMissingNode()) return fields;
        player.path("stats").path(statKey).fieldNames().forEachRemaining(fields::add);
        return fields;
    }
}
