package com.sport.web_sport.baseball.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
public class MlbApiService {

    private static final String MLB_SCHEDULE_URL =
            "https://statsapi.mlb.com/api/v1/schedule";
    private static final String MLB_GAME_URL = "https://statsapi.mlb.com/api/v1/game";
    private static final String MLB_GAME_V11_URL = "https://statsapi.mlb.com/api/v1.1/game";

    private final RestClient restClient;

    public MlbApiService() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(15_000);
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public List<JsonNode> fetchGames(String startDate, String endDate) {
        String url = String.format(
                "%s?sportId=1&gameType=R,F,D,L,W&startDate=%s&endDate=%s&hydrate=team,venue",
                MLB_SCHEDULE_URL, startDate, endDate
        );

        JsonNode root = restClient.get()
                .uri(url)
                .retrieve()
                .body(JsonNode.class);

        List<JsonNode> games = new ArrayList<>();
        if (root == null || !root.has("dates")) return games;

        for (JsonNode dateNode : root.get("dates")) {
            if (dateNode.has("games")) {
                for (JsonNode game : dateNode.get("games")) {
                    games.add(game);
                }
            }
        }
        return games;
    }

    public JsonNode fetchGameFeedLive(long gamePk) {
        return restClient.get()
                .uri(MLB_GAME_V11_URL + "/" + gamePk + "/feed/live")
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode fetchGameBoxscore(long gamePk) {
        return restClient.get()
                .uri(MLB_GAME_URL + "/" + gamePk + "/boxscore")
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode fetchGameLinescore(long gamePk) {
        return restClient.get()
                .uri(MLB_GAME_URL + "/" + gamePk + "/linescore")
                .retrieve()
                .body(JsonNode.class);
    }
}
