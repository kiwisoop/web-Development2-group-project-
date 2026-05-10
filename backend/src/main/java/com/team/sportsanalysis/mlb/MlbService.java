package com.team.sportsanalysis.mlb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

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
}
