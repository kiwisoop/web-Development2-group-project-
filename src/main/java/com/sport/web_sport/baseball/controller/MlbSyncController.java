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
