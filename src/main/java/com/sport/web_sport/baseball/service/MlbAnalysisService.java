package com.sport.web_sport.baseball.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sport.web_sport.baseball.dto.response.MlbAnalysisResponse;
import com.sport.web_sport.baseball.dto.response.MlbAnalysisResponse.InningScore;
import com.sport.web_sport.baseball.dto.response.MlbAnalysisResponse.KeyBatter;
import com.sport.web_sport.baseball.dto.response.MlbAnalysisResponse.PitcherSummary;
import com.sport.web_sport.baseball.dto.response.MlbAnalysisResponse.WinProbability;
import com.sport.web_sport.baseball.dto.response.MlbBatterStatResponse;
import com.sport.web_sport.baseball.dto.response.MlbGameDetailResponse;
import com.sport.web_sport.baseball.dto.response.MlbLinescoreResponse;
import com.sport.web_sport.baseball.dto.response.MlbPitcherStatResponse;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MlbAnalysisService {

    private static final String GROQ_ENDPOINT =
            "https://api.groq.com/openai/v1/chat/completions";

    private final MatchRepository matchRepository;
    private final MlbGameDetailService mlbGameDetailService;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String model;

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${ollama.model:gemma4:e4b}")
    private String ollamaModel;

    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public MlbAnalysisResponse analyze(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found"));
        if (match.getSportType() != SportType.BASEBALL
                || match.getExternalId() == null
                || !match.getExternalId().startsWith("MLB-")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not an MLB match");
        }

        MlbGameDetailResponse detail = mlbGameDetailService.getDetail(matchId);
        if (detail == null) {
            return MlbAnalysisResponse.builder()
                    .winProbability(WinProbability.builder().home(50).away(50).build())
                    .keyBatters(List.of())
                    .inningFlow(List.of())
                    .summary("").tactical("").keyPoint("")
                    .build();
        }

        MlbLinescoreResponse linescore = detail.getLinescore();
        List<MlbPitcherStatResponse> homePitchers = detail.getHomePitchers();
        List<MlbPitcherStatResponse> awayPitchers = detail.getAwayPitchers();
        List<MlbBatterStatResponse> homeBatters = detail.getHomeBatters();
        List<MlbBatterStatResponse> awayBatters = detail.getAwayBatters();

        int homeProb = calcHomeWinProb(linescore, homePitchers, awayPitchers);
        WinProbability winProb = WinProbability.builder()
                .home(homeProb).away(100 - homeProb).build();

        PitcherSummary homePitcher = buildPitcherSummary(homePitchers);
        PitcherSummary awayPitcher = buildPitcherSummary(awayPitchers);
        List<KeyBatter> keyBatters = buildKeyBatters(homeBatters, awayBatters,
                detail.getHomeTeamShortName(), detail.getAwayTeamShortName());
        List<InningScore> inningFlow = buildInningFlow(linescore);

        MlbAnalysisResponse.MlbAnalysisResponseBuilder builder = MlbAnalysisResponse.builder()
                .winProbability(winProb)
                .homePitcher(homePitcher)
                .awayPitcher(awayPitcher)
                .keyBatters(keyBatters)
                .inningFlow(inningFlow)
                .summary("").tactical("").keyPoint("");

        callAi(builder, detail, winProb, homePitcher, awayPitcher, keyBatters);

        return builder.build();
    }

    private int calcHomeWinProb(MlbLinescoreResponse linescore,
                                 List<MlbPitcherStatResponse> homePitchers,
                                 List<MlbPitcherStatResponse> awayPitchers) {
        if (linescore == null) return 50;

        int scoreDiff = linescore.getHomeRuns() - linescore.getAwayRuns();
        int currentInning = linescore.getCurrentInning();
        double progress = Math.min(currentInning, 9) / 9.0;
        double weight = 0.3 + (0.7 * progress);
        double base = 50.0 + (scoreDiff * 10.0 * weight);

        base += eraAdjustment(homePitchers, -3.0);
        base += eraAdjustment(awayPitchers, +3.0);

        base -= linescore.getHomeErrors() * 2.0;
        base += linescore.getAwayErrors() * 2.0;

        return (int) Math.round(Math.max(5, Math.min(95, base)));
    }

    private double eraAdjustment(List<MlbPitcherStatResponse> pitchers, double delta) {
        if (pitchers == null || pitchers.isEmpty()) return 0;
        try {
            double era = Double.parseDouble(pitchers.get(0).getEra());
            return era > 5.0 ? delta : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private PitcherSummary buildPitcherSummary(List<MlbPitcherStatResponse> pitchers) {
        if (pitchers == null || pitchers.isEmpty()) {
            return PitcherSummary.builder().name("-").strikeOuts(0)
                    .baseOnBalls(0).numberOfPitches(0).era("-").build();
        }
        MlbPitcherStatResponse p = pitchers.get(0);
        return PitcherSummary.builder()
                .name(p.getFullName())
                .strikeOuts(parseIntSafe(p.getStrikeOuts()))
                .baseOnBalls(parseIntSafe(p.getBaseOnBalls()))
                .numberOfPitches(parseIntSafe(p.getNumberOfPitches()))
                .era(p.getEra())
                .build();
    }

    private List<KeyBatter> buildKeyBatters(List<MlbBatterStatResponse> home,
                                             List<MlbBatterStatResponse> away,
                                             String homeTeam, String awayTeam) {
        List<ScoredBatter> candidates = new ArrayList<>();
        if (home != null) {
            for (MlbBatterStatResponse b : home) {
                int score = parseIntSafe(b.getHits())
                        + parseIntSafe(b.getHomeRuns()) * 2
                        + parseIntSafe(b.getRbi());
                if (score > 0) candidates.add(new ScoredBatter(b, homeTeam, score));
            }
        }
        if (away != null) {
            for (MlbBatterStatResponse b : away) {
                int score = parseIntSafe(b.getHits())
                        + parseIntSafe(b.getHomeRuns()) * 2
                        + parseIntSafe(b.getRbi());
                if (score > 0) candidates.add(new ScoredBatter(b, awayTeam, score));
            }
        }
        candidates.sort(Comparator.comparingInt(ScoredBatter::score).reversed());
        return candidates.stream().limit(3).map(s -> KeyBatter.builder()
                .team(s.team())
                .name(s.batter().getFullName())
                .hits(s.batter().getHits())
                .homeRuns(s.batter().getHomeRuns())
                .rbi(s.batter().getRbi())
                .build()).toList();
    }

    private record ScoredBatter(MlbBatterStatResponse batter, String team, int score) {}

    private List<InningScore> buildInningFlow(MlbLinescoreResponse linescore) {
        if (linescore == null || linescore.getInnings() == null) return List.of();
        return linescore.getInnings().stream()
                .map(i -> InningScore.builder()
                        .inning(i.getInningNumber())
                        .home(i.getHomeRuns())
                        .away(i.getAwayRuns())
                        .build())
                .toList();
    }

    private void callAi(MlbAnalysisResponse.MlbAnalysisResponseBuilder builder,
                         MlbGameDetailResponse detail,
                         WinProbability winProb,
                         PitcherSummary home, PitcherSummary away,
                         List<KeyBatter> keyBatters) {
        String prompt = buildPrompt(detail, winProb, home, away, keyBatters);
        String inner = null;

        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String responseBody = sendGroqRequest(prompt);
                JsonNode root = objectMapper.readTree(responseBody);
                String text = root.path("choices").path(0)
                        .path("message").path("content").asText("");
                if (!text.isBlank()) inner = text;
            } catch (Exception e) {
                log.warn("Groq 분석 실패 (Ollama로 전환): {}", e.getMessage());
            }
        }

        if (inner == null) {
            try {
                inner = callOllama(prompt);
            } catch (Exception e) {
                log.warn("Ollama 분석 실패: {}", e.getMessage());
                return;
            }
        }

        if (inner == null || inner.isBlank()) return;
        try {
            String jsonText = extractJson(inner);
            JsonNode parsed = objectMapper.readTree(jsonText);
            builder.summary(parsed.path("summary").asText(""))
                   .tactical(parsed.path("tactical").asText(""))
                   .keyPoint(parsed.path("keyPoint").asText(""));
        } catch (Exception e) {
            log.warn("AI 응답 파싱 실패: {}", e.getMessage());
        }
    }

    private String callOllama(String prompt) throws Exception {
        String url = ollamaUrl + "/api/generate";
        Map<String, Object> body = Map.of(
                "model", ollamaModel,
                "prompt", prompt,
                "stream", false
        );
        String json = objectMapper.writeValueAsString(body);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(120))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException("Ollama HTTP " + response.statusCode());
        }
        JsonNode root = objectMapper.readTree(response.body());
        return root.path("response").asText("");
    }

    private String extractJson(String text) {
        String trimmed = text.strip();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) return trimmed.substring(start, end + 1);
        return trimmed;
    }

    private String buildPrompt(MlbGameDetailResponse detail, WinProbability winProb,
                                PitcherSummary home, PitcherSummary away,
                                List<KeyBatter> keyBatters) {
        StringBuilder sb = new StringBuilder();
        sb.append("다음 MLB 경기 데이터를 바탕으로 한국어 분석을 JSON으로 작성해주세요. ")
          .append("형식: {\"summary\":\"...\",\"tactical\":\"...\",\"keyPoint\":\"...\"} ")
          .append("summary는 2~3문장 경기 요약, tactical은 양 팀 투수·타격 전략 분석, ")
          .append("keyPoint는 가장 중요한 한 가지 포인트. 수치를 해석해 설명만 작성하세요.\n\n");

        sb.append("[경기 정보]\n");
        sb.append("홈: ").append(detail.getHomeTeamName()).append("\n");
        sb.append("원정: ").append(detail.getAwayTeamName()).append("\n");
        sb.append("상태: ").append(detail.getGameStatus()).append("\n\n");

        sb.append("[승률 예측]\n");
        sb.append("홈팀 ").append(winProb.getHome()).append("% / 원정팀 ").append(winProb.getAway()).append("%\n\n");

        sb.append("[투수 비교]\n");
        sb.append("홈 ").append(home.getName())
          .append(": ").append(home.getStrikeOuts()).append("K ")
          .append(home.getBaseOnBalls()).append("BB ")
          .append(home.getNumberOfPitches()).append("구 ERA ").append(home.getEra()).append("\n");
        sb.append("원 ").append(away.getName())
          .append(": ").append(away.getStrikeOuts()).append("K ")
          .append(away.getBaseOnBalls()).append("BB ")
          .append(away.getNumberOfPitches()).append("구 ERA ").append(away.getEra()).append("\n\n");

        if (!keyBatters.isEmpty()) {
            sb.append("[핵심 타자]\n");
            for (KeyBatter b : keyBatters) {
                sb.append(b.getName()).append(" (").append(b.getTeam()).append(")")
                  .append(" - ").append(b.getHits()).append("H ")
                  .append(b.getHomeRuns()).append("HR ")
                  .append(b.getRbi()).append("RBI\n");
            }
        }

        return sb.toString();
    }

    private String sendGroqRequest(String prompt) throws Exception {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", 0.4,
                "response_format", Map.of("type", "json_object")
        );
        String json = objectMapper.writeValueAsString(body);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_ENDPOINT))
                .timeout(Duration.ofSeconds(45))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException("Groq HTTP " + response.statusCode() + " " + response.body());
        }
        return response.body();
    }

    private int parseIntSafe(String value) {
        if (value == null || value.equals("-")) return 0;
        try { return Integer.parseInt(value); } catch (NumberFormatException e) { return 0; }
    }
}
