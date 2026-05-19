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
                "%s?sportId=1&startDate=%s&endDate=%s&hydrate=team,venue",
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
}
