package com.sport.web_sport.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.analysis.repository.MatchAnalysisRepository;
import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.MatchEvent;
import com.sport.web_sport.sports.entity.MatchStat;
import com.sport.web_sport.sports.repository.MatchEventRepository;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.MatchStatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiAnalysisGenerator implements AnalysisGenerator {

    private static final int MAX_EVENTS = 20;
    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final MatchRepository matchRepository;
    private final MatchStatRepository matchStatRepository;
    private final MatchEventRepository matchEventRepository;
    private final MatchAnalysisRepository matchAnalysisRepository;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    @Transactional
    public MatchAnalysis generate(Long matchId, boolean forceRegenerate) {
        Match match = matchRepository.findByIdWithTeams(matchId)
                .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));

        MatchAnalysis analysis = matchAnalysisRepository
                .findByMatchIdAndProvider(matchId, AnalysisProvider.GEMINI)
                .orElseGet(() -> MatchAnalysis.builder()
                        .match(match)
                        .provider(AnalysisProvider.GEMINI)
                        .createdAt(LocalDateTime.now())
                        .build());

        if (apiKey == null || apiKey.isBlank()) {
            analysis.setStatus(AnalysisStatus.FAILED);
            analysis.setErrorMessage("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
            analysis.setUpdatedAt(LocalDateTime.now());
            return matchAnalysisRepository.save(analysis);
        }

        try {
            List<MatchStat> stats = matchStatRepository.findByMatchId(matchId);
            List<MatchEvent> events = matchEventRepository.findByMatchIdOrderByEventTimeAsc(matchId);

            String prompt = buildPrompt(match, stats, events);
            String responseText = callGemini(prompt);
            JsonNode parsed = parseStructured(responseText);

            analysis.setSummaryText(textOrEmpty(parsed, "summary"));
            analysis.setTacticalAnalysis(textOrEmpty(parsed, "tactical"));
            analysis.setKeyPoint(textOrEmpty(parsed, "keyPoint"));
            analysis.setStatus(AnalysisStatus.DONE);
            analysis.setErrorMessage(null);
            analysis.setUpdatedAt(LocalDateTime.now());
            return matchAnalysisRepository.save(analysis);
        } catch (Exception e) {
            log.warn("Gemini analysis failed for matchId={}", matchId, e);
            analysis.setStatus(AnalysisStatus.FAILED);
            analysis.setErrorMessage(truncate(e.getMessage(), 500));
            analysis.setUpdatedAt(LocalDateTime.now());
            return matchAnalysisRepository.save(analysis);
        }
    }

    private String buildPrompt(Match match, List<MatchStat> stats, List<MatchEvent> events) {
        StringBuilder sb = new StringBuilder();
        sb.append("다음 스포츠 경기 데이터를 바탕으로 간결한 한국어 분석을 제공해주세요. ")
          .append("형식은 JSON: {\"summary\":\"...\",\"tactical\":\"...\",\"keyPoint\":\"...\"} ")
          .append("summary는 2~3문장, tactical은 양 팀 전술 분석, keyPoint는 핵심 포인트.\n\n");

        sb.append("[경기 정보]\n");
        sb.append("종목: ").append(match.getSportType()).append("\n");
        sb.append("홈: ").append(safe(match.getHomeTeam() != null ? match.getHomeTeam().getTeamName() : null)).append("\n");
        sb.append("원정: ").append(safe(match.getAwayTeam() != null ? match.getAwayTeam().getTeamName() : null)).append("\n");
        sb.append("스코어: ").append(safe(match.getHomeScore())).append("-").append(safe(match.getAwayScore())).append("\n");
        sb.append("상태: ").append(match.getStatus()).append("\n");
        if (match.getVenue() != null) sb.append("장소: ").append(match.getVenue()).append("\n");
        if (match.getMatchDate() != null) sb.append("일시: ").append(match.getMatchDate()).append("\n");

        if (stats != null && !stats.isEmpty()) {
            sb.append("\n[스탯]\n");
            for (MatchStat s : stats) {
                sb.append("- ").append(s.getStatName()).append(": ").append(s.getStatValue()).append("\n");
            }
        }

        if (events != null && !events.isEmpty()) {
            sb.append("\n[주요 이벤트]\n");
            int limit = Math.min(events.size(), MAX_EVENTS);
            for (int i = 0; i < limit; i++) {
                MatchEvent e = events.get(i);
                sb.append("- ").append(e.getEventTime()).append(" ")
                        .append(e.getEventType()).append(" ")
                        .append(safe(e.getDescription())).append("\n");
            }
        }

        return sb.toString();
    }

    private String callGemini(String prompt) throws Exception {
        String url = String.format(ENDPOINT, model, apiKey);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.4
                )
        );
        String json = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(45))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            throw new BusinessException("Gemini API 오류 (status=" + response.statusCode() + "): "
                    + truncate(response.body(), 300));
        }
        return response.body();
    }

    private JsonNode parseStructured(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new BusinessException("Gemini 응답에 candidates 없음");
        }
        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new BusinessException("Gemini 응답에 parts 없음");
        }
        String inner = parts.get(0).path("text").asText("");
        if (inner.isBlank()) {
            throw new BusinessException("Gemini 응답 text가 비어있음");
        }
        return objectMapper.readTree(inner);
    }

    private static String textOrEmpty(JsonNode node, String field) {
        JsonNode v = node.path(field);
        return v.isMissingNode() || v.isNull() ? "" : v.asText("");
    }

    private static String safe(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
