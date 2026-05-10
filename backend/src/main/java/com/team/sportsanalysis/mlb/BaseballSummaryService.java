package com.team.sportsanalysis.mlb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BaseballSummaryService {

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    private final MlbService mlbService;
    private final RestTemplate rest;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    public BaseballSummaryService(MlbService mlbService, RestTemplateBuilder builder) {
        this.mlbService = mlbService;
        this.rest = builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(20))
                .build();
    }

    // -------- Mock summary (rule-based, always works) --------
    public BaseballSummaryResponse buildMockSummary(long gamePk) {
        MlbGameDetail d = mlbService.getGameDetail(gamePk);
        String home = nz(d.getHomeTeam(), "Home");
        String away = nz(d.getAwayTeam(), "Away");
        Integer hs = d.getHomeScore();
        Integer as = d.getAwayScore();

        String winnerLine;
        if (hs == null || as == null) {
            winnerLine = away + " @ " + home + " 경기 정보가 아직 충분하지 않습니다.";
        } else if (hs > as) {
            winnerLine = home + "이(가) " + away + "을(를) " + hs + "-" + as + "로 앞섰습니다.";
        } else if (hs < as) {
            winnerLine = away + "이(가) " + home + "을(를) " + as + "-" + hs + "로 앞섰습니다.";
        } else {
            winnerLine = home + "와 " + away + "이(가) " + hs + "-" + as + " 동점 상황입니다.";
        }

        String inningLine = (d.getCurrentInning() == null)
                ? "현재 이닝 정보 없음."
                : "현재 " + d.getCurrentInning() + "회 " + nz(d.getInningHalf(), "") + " 진행 중.";

        StringBuilder pattern = new StringBuilder();
        List<MlbInningScore> innings = d.getInnings();
        if (innings != null && !innings.isEmpty()) {
            pattern.append("이닝별 득점 흐름: ");
            for (MlbInningScore i : innings) {
                pattern.append(i.getInning()).append("회(")
                        .append(away).append(" ").append(nzInt(i.getAwayRuns()))
                        .append("/").append(home).append(" ").append(nzInt(i.getHomeRuns()))
                        .append(") ");
            }
        } else {
            pattern.append("이닝별 득점 데이터가 부족합니다.");
        }

        String rhe = "R/H/E — " + away + ": " + nzInt(d.getAwayScore()) + "/" + nzInt(d.getAwayHits()) + "/" + nzInt(d.getAwayErrors())
                + ", " + home + ": " + nzInt(d.getHomeScore()) + "/" + nzInt(d.getHomeHits()) + "/" + nzInt(d.getHomeErrors()) + ".";

        String eventsLine;
        if (d.getEvents() == null || d.getEvents().isEmpty()) {
            eventsLine = "주요 이벤트가 아직 기록되지 않았습니다.";
        } else {
            StringBuilder sb = new StringBuilder("주요 장면: ");
            int limit = Math.min(3, d.getEvents().size());
            for (int i = 0; i < limit; i++) {
                MlbGameEvent e = d.getEvents().get(i);
                sb.append("[").append(nz(e.getHalfInning(), "")).append(" ").append(nzInt(e.getInning())).append("회] ")
                  .append(nz(e.getDescription(), "")).append(" | ");
            }
            eventsLine = sb.toString();
        }

        String summary = winnerLine + " " + inningLine + " " + rhe + " " + eventsLine;

        String tactical;
        if (hs != null && as != null) {
            String leader = hs >= as ? home : away;
            tactical = "전술 분석: " + leader + "이(가) 경기 흐름의 주도권을 잡고 있으며, "
                    + "이닝별 득점 분포와 R/H/E 지표로 보아 타선의 응집력이 결과에 큰 영향을 주고 있습니다.";
        } else {
            tactical = "전술 분석: 점수 데이터가 부족하여 흐름을 단정할 수 없으나, 이닝별 진행 상황을 주의 깊게 볼 필요가 있습니다.";
        }

        String keyPoint;
        if (d.getEvents() != null && !d.getEvents().isEmpty()) {
            MlbGameEvent first = d.getEvents().get(0);
            keyPoint = "핵심 포인트: " + nzInt(first.getInning()) + "회 " + nz(first.getHalfInning(), "")
                    + "의 \"" + nz(first.getDescription(), "결정적 장면") + "\" 장면이 경기에 가장 큰 영향을 주었습니다.";
        } else {
            keyPoint = "핵심 포인트: 결정적 장면을 판별하기에 데이터가 부족합니다.";
        }

        return BaseballSummaryResponse.builder()
                .gamePk(gamePk)
                .mode("MOCK")
                .summaryText(summary)
                .tacticalAnalysis(tactical)
                .keyPoint(keyPoint)
                .build();
    }

    // -------- Gemini summary --------
    public BaseballSummaryResponse buildGeminiSummary(long gamePk) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return BaseballSummaryResponse.builder()
                    .gamePk(gamePk)
                    .mode("GEMINI")
                    .errorMessage("GEMINI_API_KEY 환경 변수가 설정되어 있지 않습니다.")
                    .build();
        }

        MlbGameDetail d;
        try {
            d = mlbService.getGameDetail(gamePk);
        } catch (Exception e) {
            return BaseballSummaryResponse.builder()
                    .gamePk(gamePk)
                    .mode("GEMINI")
                    .errorMessage("경기 데이터를 불러오지 못했습니다: " + e.getMessage())
                    .build();
        }

        String prompt = buildPrompt(d);

        try {
            // body: { "contents": [ { "parts": [ { "text": "..." } ] } ] }
            Map<String, Object> part = new LinkedHashMap<>();
            part.put("text", prompt);
            Map<String, Object> content = new LinkedHashMap<>();
            content.put("parts", List.of(part));
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("contents", List.of(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey);

            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers);
            ResponseEntity<String> resp = rest.exchange(GEMINI_URL, HttpMethod.POST, req, String.class);

            String json = resp.getBody();
            if (json == null || json.isBlank()) {
                return BaseballSummaryResponse.builder()
                        .gamePk(gamePk).mode("GEMINI")
                        .errorMessage("Gemini 응답이 비어 있습니다.").build();
            }

            JsonNode root = mapper.readTree(json);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.size() == 0) {
                return BaseballSummaryResponse.builder()
                        .gamePk(gamePk).mode("GEMINI")
                        .errorMessage("Gemini가 응답 후보를 반환하지 않았습니다.").build();
            }
            JsonNode parts = candidates.get(0).path("content").path("parts");
            StringBuilder textBuilder = new StringBuilder();
            for (JsonNode p : parts) {
                String t = p.path("text").asText("");
                if (!t.isBlank()) textBuilder.append(t).append("\n");
            }
            String text = textBuilder.toString().trim();

            // Try to parse JSON object out of the response.
            String summaryText = null, tactical = null, keyPoint = null;
            String jsonCandidate = extractJsonObject(text);
            if (jsonCandidate != null) {
                try {
                    JsonNode parsed = mapper.readTree(jsonCandidate);
                    summaryText = parsed.path("summaryText").asText(null);
                    tactical    = parsed.path("tacticalAnalysis").asText(null);
                    keyPoint    = parsed.path("keyPoint").asText(null);
                } catch (Exception ignore) { /* fall through to fallback */ }
            }

            if (summaryText == null || summaryText.isBlank()) {
                summaryText = text;
                tactical = (tactical == null || tactical.isBlank())
                        ? "전술 분석은 Gemini 응답에서 별도로 구분되지 않았습니다."
                        : tactical;
                keyPoint = (keyPoint == null || keyPoint.isBlank())
                        ? "핵심 포인트는 Gemini 요약 본문을 참고해 주세요."
                        : keyPoint;
            }

            return BaseballSummaryResponse.builder()
                    .gamePk(gamePk)
                    .mode("GEMINI")
                    .summaryText(summaryText)
                    .tacticalAnalysis(tactical)
                    .keyPoint(keyPoint)
                    .build();

        } catch (Exception e) {
            return BaseballSummaryResponse.builder()
                    .gamePk(gamePk)
                    .mode("GEMINI")
                    .errorMessage("Gemini API 호출에 실패했습니다: " + e.getMessage())
                    .build();
        }
    }

    // -------- Compare --------
    public Map<String, BaseballSummaryResponse> buildCompare(long gamePk) {
        Map<String, BaseballSummaryResponse> out = new HashMap<>();
        out.put("mock", buildMockSummary(gamePk));
        out.put("gemini", buildGeminiSummary(gamePk));
        return out;
    }

    // -------- helpers --------
    private String buildPrompt(MlbGameDetail d) {
        StringBuilder sb = new StringBuilder();
        sb.append("당신은 야구 분석가입니다. 아래 MLB 경기 데이터를 바탕으로 한국어로 분석해 주세요.\n");
        sb.append("반드시 아래 JSON 형식으로만 응답하세요. 코드블록이나 다른 텍스트를 추가하지 마세요.\n");
        sb.append("{\n  \"summaryText\": \"...\",\n  \"tacticalAnalysis\": \"...\",\n  \"keyPoint\": \"...\"\n}\n\n");
        sb.append("[경기 데이터]\n");
        sb.append("- gamePk: ").append(d.getGamePk()).append("\n");
        sb.append("- 경기 일시: ").append(nz(d.getGameDate(), "-")).append("\n");
        sb.append("- 경기장: ").append(nz(d.getVenue(), "-")).append("\n");
        sb.append("- 상태: ").append(nz(d.getStatus(), "-")).append("\n");
        sb.append("- 원정팀: ").append(nz(d.getAwayTeam(), "Away"))
                .append(" (R ").append(nzInt(d.getAwayScore()))
                .append(" / H ").append(nzInt(d.getAwayHits()))
                .append(" / E ").append(nzInt(d.getAwayErrors())).append(")\n");
        sb.append("- 홈팀: ").append(nz(d.getHomeTeam(), "Home"))
                .append(" (R ").append(nzInt(d.getHomeScore()))
                .append(" / H ").append(nzInt(d.getHomeHits()))
                .append(" / E ").append(nzInt(d.getHomeErrors())).append(")\n");
        sb.append("- 현재 이닝: ").append(nzInt(d.getCurrentInning()))
                .append(" (").append(nz(d.getInningHalf(), "-")).append(")\n");

        if (d.getInnings() != null && !d.getInnings().isEmpty()) {
            sb.append("- 이닝별 득점:\n");
            for (MlbInningScore i : d.getInnings()) {
                sb.append("  ").append(i.getInning()).append("회 — 원정 ")
                        .append(nzInt(i.getAwayRuns())).append(" / 홈 ")
                        .append(nzInt(i.getHomeRuns())).append("\n");
            }
        }

        if (d.getEvents() != null && !d.getEvents().isEmpty()) {
            sb.append("- 주요 이벤트:\n");
            int limit = Math.min(8, d.getEvents().size());
            for (int i = 0; i < limit; i++) {
                MlbGameEvent e = d.getEvents().get(i);
                sb.append("  [").append(nz(e.getHalfInning(), "-")).append(" ")
                        .append(nzInt(e.getInning())).append("회] ")
                        .append(nz(e.getDescription(), "-")).append("\n");
            }
        }
        sb.append("\n응답은 JSON 객체 하나만, summaryText/tacticalAnalysis/keyPoint 세 필드를 포함하여 작성하세요.");
        return sb.toString();
    }

    private String extractJsonObject(String text) {
        if (text == null) return null;
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return null;
    }

    private String nz(String v, String def) { return (v == null || v.isBlank()) ? def : v; }
    private String nzInt(Integer v) { return v == null ? "-" : String.valueOf(v); }
}
