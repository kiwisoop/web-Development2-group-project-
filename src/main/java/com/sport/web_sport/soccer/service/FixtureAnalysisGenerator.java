package com.sport.web_sport.soccer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import com.sport.web_sport.soccer.entity.Fixture;
import com.sport.web_sport.soccer.entity.FixtureAnalysis;
import com.sport.web_sport.soccer.entity.Standing;
import com.sport.web_sport.soccer.repository.FixtureAnalysisRepository;
import com.sport.web_sport.soccer.repository.FixtureRepository;
import com.sport.web_sport.soccer.repository.StandingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
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
import java.util.Optional;

/**
 * K리그 Fixture에 대한 Groq AI 분석 생성기.
 * 프롬프트에 양 팀 시즌 성적(STANDINGS) + 최근 5경기 폼(FIXTURES)을 함께 보내 상세 분석 생성.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FixtureAnalysisGenerator {

    private static final int RECENT_MATCHES = 5;
    private static final String GROQ_ENDPOINT =
            "https://api.groq.com/openai/v1/chat/completions";

    private final FixtureRepository fixtureRepository;
    private final FixtureAnalysisRepository analysisRepository;
    private final StandingRepository standingRepository;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Transactional
    public FixtureAnalysis generate(String fixtureId) {
        Fixture fixture = fixtureRepository.findByIdWithTeams(fixtureId)
                .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));

        FixtureAnalysis analysis = analysisRepository
                .findByFixtureIdAndProvider(fixtureId, AnalysisProvider.GROQ)
                .orElseGet(() -> FixtureAnalysis.builder()
                        .fixtureId(fixtureId)
                        .provider(AnalysisProvider.GROQ)
                        .createdAt(LocalDateTime.now())
                        .build());

        if (apiKey == null || apiKey.isBlank()) {
            analysis.setStatus(AnalysisStatus.FAILED);
            analysis.setErrorMessage("GROQ_API_KEY 환경변수가 설정되지 않았습니다.");
            analysis.setUpdatedAt(LocalDateTime.now());
            return analysisRepository.save(analysis);
        }

        try {
            // 추가 컨텍스트 수집 (실패해도 분석은 진행)
            Optional<Standing> homeStanding = safeStanding(fixture.getSeason(), fixture.getHomeTeamId());
            Optional<Standing> awayStanding = safeStanding(fixture.getSeason(), fixture.getAwayTeamId());
            List<Fixture> homeRecent = safeRecentMatches(fixture, fixture.getHomeTeamId());
            List<Fixture> awayRecent = safeRecentMatches(fixture, fixture.getAwayTeamId());

            String prompt = buildPrompt(fixture, homeStanding, awayStanding, homeRecent, awayRecent);
            String responseText = callGroq(prompt);
            JsonNode parsed = parseStructured(responseText);

            analysis.setSummaryText(textOrEmpty(parsed, "summary"));
            analysis.setTacticalAnalysis(textOrEmpty(parsed, "tactical"));
            analysis.setKeyPoint(textOrEmpty(parsed, "keyPoint"));
            analysis.setStatus(AnalysisStatus.DONE);
            analysis.setErrorMessage(null);
            analysis.setUpdatedAt(LocalDateTime.now());
            return analysisRepository.save(analysis);
        } catch (Exception e) {
            log.warn("Groq analysis failed for fixtureId={}", fixtureId, e);
            analysis.setStatus(AnalysisStatus.FAILED);
            analysis.setErrorMessage(truncate(e.getMessage(), 500));
            analysis.setUpdatedAt(LocalDateTime.now());
            return analysisRepository.save(analysis);
        }
    }

    private Optional<Standing> safeStanding(String season, String teamId) {
        if (season == null || teamId == null) return Optional.empty();
        try {
            return standingRepository.findBySeasonAndTeamId(season, teamId);
        } catch (Exception e) {
            log.warn("Standing lookup failed (season={}, teamId={})", season, teamId, e);
            return Optional.empty();
        }
    }

    private List<Fixture> safeRecentMatches(Fixture fixture, String teamId) {
        if (fixture.getSeason() == null || teamId == null) return List.of();
        try {
            return fixtureRepository.findRecentFinishedByTeam(
                    fixture.getSeason(),
                    teamId,
                    fixture.getFixtureId(),
                    PageRequest.of(0, RECENT_MATCHES));
        } catch (Exception e) {
            log.warn("Recent matches lookup failed (teamId={})", teamId, e);
            return List.of();
        }
    }

    private String buildPrompt(Fixture f,
                               Optional<Standing> homeStanding,
                               Optional<Standing> awayStanding,
                               List<Fixture> homeRecent,
                               List<Fixture> awayRecent) {
        String homeName = teamName(f, true);
        String awayName = teamName(f, false);

        StringBuilder sb = new StringBuilder();
        sb.append("당신은 K리그 1 전문 축구 분석가입니다. ")
          .append("아래 경기 데이터와 양 팀의 시즌 성적·최근 폼을 종합하여 ")
          .append("깊이 있는 한국어 분석을 작성해주세요.\n\n");

        sb.append("출력 형식은 반드시 JSON: ")
          .append("{\"summary\":\"...\",\"tactical\":\"...\",\"keyPoint\":\"...\"}\n");
        sb.append("- summary: 5~7문장으로 경기 결과·흐름·시즌 맥락을 종합 정리.\n")
          .append("- tactical: 단락 2개. 첫 단락은 ").append(homeName).append("의 전술과 강점, ")
          .append("두 번째 단락은 ").append(awayName).append("의 전술과 약점·실수.\n")
          .append("- keyPoint: 핵심 포인트 3가지를 '1) ... 2) ... 3) ...' 형식으로 한 문자열에 담아 정리.\n\n");

        sb.append("[경기 정보]\n");
        sb.append("리그: ").append(safe(f.getLeagueName())).append("\n");
        sb.append("시즌: ").append(safe(f.getSeason())).append("\n");
        sb.append("라운드: ").append(safe(f.getRound())).append("\n");
        sb.append("홈팀: ").append(homeName).append("\n");
        sb.append("원정팀: ").append(awayName).append("\n");
        sb.append("스코어: ").append(safe(f.getHomeScore())).append("-").append(safe(f.getAwayScore())).append("\n");
        if (f.getVenue() != null)     sb.append("경기장: ").append(f.getVenue()).append("\n");
        if (f.getMatchDate() != null) sb.append("일시: ").append(f.getMatchDate()).append("\n");
        if (f.getSpectators() != null) sb.append("관중: ").append(f.getSpectators()).append("\n");

        appendStandingBlock(sb, homeName, "홈팀", homeStanding);
        appendStandingBlock(sb, awayName, "원정팀", awayStanding);
        appendRecentBlock(sb, homeName, f.getHomeTeamId(), homeRecent);
        appendRecentBlock(sb, awayName, f.getAwayTeamId(), awayRecent);

        return sb.toString();
    }

    private void appendStandingBlock(StringBuilder sb, String teamName, String role, Optional<Standing> opt) {
        if (opt.isEmpty()) return;
        Standing s = opt.get();
        sb.append("\n[").append(role).append("(").append(teamName).append(") 시즌 성적]\n");
        sb.append("- 순위: ").append(nz(s.getRankPosition())).append("위 (승점 ").append(nz(s.getPoints())).append(")\n");
        sb.append("- 전적: ").append(nz(s.getWins())).append("승 ").append(nz(s.getDraws())).append("무 ").append(nz(s.getLosses())).append("패 (")
          .append(nz(s.getPlayed())).append("경기)\n");
        sb.append("- 득실: ").append(nz(s.getGoalsFor())).append("득점 / ").append(nz(s.getGoalsAgainst())).append("실점 (득실차 ")
          .append(formatDiff(s.getGoalDiff())).append(")\n");
        if (s.getStandingDesc() != null) sb.append("- 비고: ").append(s.getStandingDesc()).append("\n");
    }

    private void appendRecentBlock(StringBuilder sb, String teamName, String teamId, List<Fixture> recent) {
        if (recent == null || recent.isEmpty()) return;
        sb.append("\n[").append(teamName).append(" 최근 ").append(recent.size()).append("경기]\n");
        for (Fixture r : recent) {
            boolean isHome = teamId != null && teamId.equals(r.getHomeTeamId());
            String myScore  = isHome ? safe(r.getHomeScore()) : safe(r.getAwayScore());
            String oppScore = isHome ? safe(r.getAwayScore()) : safe(r.getHomeScore());
            String opp      = isHome ? safe(r.getAwayTeamName()) : safe(r.getHomeTeamName());
            String venue    = isHome ? "홈" : "원정";
            String outcome  = outcome(myScore, oppScore);
            String dateStr  = r.getMatchDateStr() != null ? r.getMatchDateStr() :
                    (r.getMatchDate() != null ? r.getMatchDate().toLocalDate().toString() : "");
            sb.append("- ").append(dateStr).append(" vs ").append(opp)
              .append(" (").append(venue).append(") — ")
              .append(myScore).append("-").append(oppScore).append(" ").append(outcome).append("\n");
        }
    }

    private static String teamName(Fixture f, boolean home) {
        if (home) {
            return f.getHomeTeam() != null && f.getHomeTeam().getTeamName() != null
                    ? f.getHomeTeam().getTeamName() : safe(f.getHomeTeamName());
        }
        return f.getAwayTeam() != null && f.getAwayTeam().getTeamName() != null
                ? f.getAwayTeam().getTeamName() : safe(f.getAwayTeamName());
    }

    private static String outcome(String myScore, String oppScore) {
        try {
            int me = Integer.parseInt(myScore.trim());
            int op = Integer.parseInt(oppScore.trim());
            if (me > op) return "승";
            if (me < op) return "패";
            return "무";
        } catch (Exception e) {
            return "-";
        }
    }

    private static String formatDiff(Integer diff) {
        if (diff == null) return "0";
        return diff > 0 ? "+" + diff : String.valueOf(diff);
    }

    private static int nz(Integer v) { return v == null ? 0 : v; }

    private String callGroq(String prompt) throws Exception {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", 0.5,
                "max_tokens", 2048,
                "response_format", Map.of("type", "json_object")
        );
        String json = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_ENDPOINT))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            throw new BusinessException("Groq API 오류 (status=" + response.statusCode() + "): "
                    + truncate(response.body(), 300));
        }
        return response.body();
    }

    private JsonNode parseStructured(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        String inner = root.path("choices").path(0)
                .path("message").path("content").asText("");
        if (inner.isBlank()) {
            throw new BusinessException("Groq 응답 content가 비어있음");
        }
        return objectMapper.readTree(extractJson(inner));
    }

    private static String extractJson(String text) {
        String trimmed = text.strip();
        int start = trimmed.indexOf('{');
        int end   = trimmed.lastIndexOf('}');
        return (start >= 0 && end > start) ? trimmed.substring(start, end + 1) : trimmed;
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
