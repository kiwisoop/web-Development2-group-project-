package com.sport.web_sport.esports.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sport.web_sport.esports.dto.CitoScheduleResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class CitoApiService {

    private static final String LEAGUE_ID = "lol-lck";
    private static final int MAX_PAGES = 10;

    @Value("${cito.api.key}")
    private String apiKey;

    @Value("${cito.api.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** 오늘 예정된 LCK 경기 */
    public CitoScheduleResponse fetchTodaySchedule() {
        String url = baseUrl + "/lol/leagues/" + LEAGUE_ID + "/schedule";
        return get(url, CitoScheduleResponse.class);
    }

    /** 기간 경기 결과 조회 - 단일 페이지 */
    public CitoScheduleResponse fetchScheduleByDateRange(String from, String to) {
        return fetchAllScheduleByDateRange(from, to);
    }

    /** 기간 경기 전체 조회 (matchId 기준 중복 제거, cito API는 &page= 파라미터 미지원) */
    public CitoScheduleResponse fetchAllScheduleByDateRange(String from, String to) {
        String base = baseUrl + "/lol/leagues/" + LEAGUE_ID + "/schedule?from=" + from + "&to=" + to;
        // LinkedHashMap으로 matchId 중복 제거 (순서 보존)
        Map<String, CitoScheduleResponse.MatchEvent> eventMap = new LinkedHashMap<>();
        CitoScheduleResponse first = null;

        for (int page = 1; page <= MAX_PAGES; page++) {
            String url = base + (page > 1 ? "&page=" + page : "");
            CitoScheduleResponse resp = get(url, CitoScheduleResponse.class);
            if (resp == null || resp.getData() == null) break;
            if (first == null) first = resp;
            if (resp.getData().getEvents() != null) {
                int before = eventMap.size();
                resp.getData().getEvents().forEach(e -> {
                    if (e.getMatchId() != null) eventMap.putIfAbsent(e.getMatchId(), e);
                });
                // 새 이벤트가 추가되지 않았으면 API가 동일 페이지를 반복 → 중단
                if (page > 1 && eventMap.size() == before) break;
            }
            if (!Boolean.TRUE.equals(resp.getData().getHasMore())) break;
        }

        if (first != null && first.getData() != null) {
            first.getData().setEvents(new ArrayList<>(eventMap.values()));
        }
        return first;
    }

    /** 토너먼트 순위표 조회 */
    public List<Map<String, Object>> fetchStandings(String tournamentId) {
        String url = baseUrl + "/lol/tournaments/" + tournamentId + "/standings";
        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                    url, HttpMethod.GET, buildRequest(), String.class);
            log.info("Cito standings {} → {}", tournamentId, resp.getStatusCode());
            return objectMapper.readValue(resp.getBody(), new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Cito standings 실패 [{}]: {}", tournamentId, e.getMessage());
            return null;
        }
    }

    private <T> T get(String url, Class<T> responseType) {
        try {
            ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.GET, buildRequest(), responseType);
            log.info("Cito API {} → {}", url, response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            log.warn("Cito API 실패 [{}]: {}", url, e.getMessage());
            return null;
        }
    }

    private HttpEntity<Void> buildRequest() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return new HttpEntity<>(headers);
    }
}
