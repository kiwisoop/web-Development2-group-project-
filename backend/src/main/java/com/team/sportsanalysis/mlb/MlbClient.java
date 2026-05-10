package com.team.sportsanalysis.mlb;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;

// Thin HTTP client for the MLB Stats API.
// Spring Boot calls MLB; React only talks to our /api/mlb endpoint.
@Component
public class MlbClient {

    private final RestTemplate rest;

    @Value("${mlb.base-url:https://statsapi.mlb.com/api/v1}")
    private String baseUrl;

    public MlbClient(RestTemplateBuilder builder) {
        this.rest = builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String fetchScheduleJson(String date) {
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/schedule")
                .queryParam("sportId", 1)
                .queryParam("date", date)
                .queryParam("hydrate", "team,linescore")
                .toUriString();
        return rest.getForObject(url, String.class);
    }

    public String fetchScheduleRangeJson(String startDate, String endDate) {
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/schedule")
                .queryParam("sportId", 1)
                .queryParam("startDate", startDate)
                .queryParam("endDate", endDate)
                .queryParam("hydrate", "team,linescore")
                .toUriString();
        return rest.getForObject(url, String.class);
    }

    // The live feed lives under /api/v1.1, not /api/v1, so build from the host.
    public String fetchLiveFeedJson(long gamePk) {
        String host = baseUrl.replaceFirst("/api/v\\d+(\\.\\d+)?$", "");
        String url = host + "/api/v1.1/game/" + gamePk + "/feed/live";
        return rest.getForObject(url, String.class);
    }

    public String fetchStandingsJson(int season) {
        // 103 = AL, 104 = NL
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/standings")
                .queryParam("leagueId", "103,104")
                .queryParam("season", season)
                .queryParam("standingsTypes", "regularSeason")
                .queryParam("hydrate", "team,league,division")
                .toUriString();
        return rest.getForObject(url, String.class);
    }

    public String fetchStatLeadersJson(String statGroup, String leaderCategory, int season, int limit) {
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/stats/leaders")
                .queryParam("leaderCategories", leaderCategory)
                .queryParam("statGroup", statGroup)
                .queryParam("season", season)
                .queryParam("sportId", 1)
                .queryParam("limit", limit)
                .toUriString();
        return rest.getForObject(url, String.class);
    }
}
