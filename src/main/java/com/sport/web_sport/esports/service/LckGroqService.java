package com.sport.web_sport.esports.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sport.web_sport.esports.dto.LckCitoAnalysisRequest;
import com.sport.web_sport.esports.entity.Game;
import com.sport.web_sport.esports.entity.PlayerGameStat;
import com.sport.web_sport.esports.repository.GameRepository;
import com.sport.web_sport.esports.repository.PlayerGameStatRepository;
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
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LckGroqService {

    private static final String GROQ_ENDPOINT =
            "https://api.groq.com/openai/v1/chat/completions";
    private static final int MAX_GAMES = 5;

    private final GameRepository            gameRepository;
    private final PlayerGameStatRepository  playerStatRepository;
    private final ObjectMapper              objectMapper;

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // ── 공개 API ──────────────────────────────────────────────────────────────────

    /** Cito 경기 맥락 + DB 선수 스탯으로 Groq AI 분석 생성 */
    @Transactional(readOnly = true)
    public Map<String, Object> analyzeMatch(LckCitoAnalysisRequest req) {
        if (apiKey == null || apiKey.isBlank()) {
            return Map.of("error", "GROQ_API_KEY 환경변수가 설정되지 않았습니다.");
        }

        List<Game> games = fetchGames(req.getTeam1Code(), req.getTeam2Code());
        String prompt = buildPrompt(req, games);

        try {
            String rawResponse = callGroq(prompt);
            JsonNode parsed    = parseStructured(rawResponse);
            return Map.of(
                "summary",  textOrEmpty(parsed, "summary"),
                "tactical", textOrEmpty(parsed, "tactical"),
                "keyPoint", textOrEmpty(parsed, "keyPoint")
            );
        } catch (Exception e) {
            log.warn("LCK Groq analysis failed for {}vs{}", req.getTeam1Code(), req.getTeam2Code(), e);
            return Map.of("error", truncate(e.getMessage(), 400));
        }
    }

    /** 팀 코드 쌍으로 경기별 선수 KDA + 데미지 기여도 반환 */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMatchPlayerStats(String code1, String code2) {
        List<Game> games = fetchGames(code1, code2);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Game g : games) {
            result.add(buildGameStats(g));
        }
        return result;
    }

    // ── 내부 헬퍼 ────────────────────────────────────────────────────────────────

    private List<Game> fetchGames(String code1, String code2) {
        if (code1 == null || code2 == null) return List.of();
        List<Game> all = gameRepository.findRecentByTeamCodes(code1, code2);
        return all.size() > MAX_GAMES ? all.subList(0, MAX_GAMES) : all;
    }

    private Map<String, Object> buildGameStats(Game g) {
        List<PlayerGameStat> stats = playerStatRepository.findByGameGameId(g.getGameId());
        Long blueId = g.getBlueTeam().getId();

        List<Map<String, Object>> blueList = buildPlayerList(stats, blueId, true);
        List<Map<String, Object>> redList  = buildPlayerList(stats, blueId, false);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("gameNumber", g.getGameNumber());
        if (g.getDuration() != null) {
            int min = g.getDuration() / 60, sec = g.getDuration() % 60;
            m.put("duration", min + "분 " + sec + "초");
        }
        m.put("winnerCode", g.getWinnerTeam() != null ? g.getWinnerTeam().getShortName() : null);
        m.put("blueTeam",  Map.of("code", g.getBlueTeam().getShortName(), "name", g.getBlueTeam().getTeamName(), "players", blueList));
        m.put("redTeam",   Map.of("code", g.getRedTeam().getShortName(), "name", g.getRedTeam().getTeamName(), "players", redList));
        return m;
    }

    private List<Map<String, Object>> buildPlayerList(List<PlayerGameStat> stats, Long blueId, boolean blue) {
        return stats.stream()
            .filter(s -> {
                boolean isBlue = s.getPlayer().getTeam().getId().equals(blueId);
                return blue ? isBlue : !isBlue;
            })
            .sorted(Comparator.comparingInt(s -> posOrder(s.getPlayer().getPosition())))
            .map(s -> {
                Map<String, Object> p = new LinkedHashMap<>();
                p.put("position",    s.getPlayer().getPosition());
                p.put("nickname",    s.getPlayer().getNickname());
                p.put("champion",    s.getChampionName());
                p.put("kills",       nz(s.getKills()));
                p.put("deaths",      nz(s.getDeaths()));
                p.put("assists",     nz(s.getAssists()));
                p.put("cs",          nz(s.getCs()));
                p.put("damage",      nz(s.getDamage()));
                p.put("damageShare", s.getTeamDamageRatio() != null
                    ? Math.round(s.getTeamDamageRatio() * 10.0) / 10.0 : 0.0);
                p.put("gold",        nz(s.getGold()));
                return p;
            })
            .toList();
    }

    private String buildPrompt(LckCitoAnalysisRequest req, List<Game> games) {
        StringBuilder sb = new StringBuilder();
        sb.append("다음 LCK(리그 오브 레전드 챔피언스 코리아) 경기 데이터를 바탕으로 ")
          .append("간결한 한국어 경기 요약을 제공해주세요. ")
          .append("형식은 JSON: {\"summary\":\"...\",\"tactical\":\"...\",\"keyPoint\":\"...\"} ")
          .append("summary는 2~3문장 경기 결과 요약, tactical은 양 팀 전술 분석, ")
          .append("keyPoint는 MVP급 선수 포함 핵심 포인트.\n\n");

        sb.append("[경기 정보]\n")
          .append("대회: LCK\n");
        if (req.getBlockName() != null) sb.append("라운드: ").append(req.getBlockName()).append("\n");
        sb.append("팀1: ").append(safe(req.getTeam1Name())).append(" (").append(safe(req.getTeam1Code())).append(")\n")
          .append("팀2: ").append(safe(req.getTeam2Name())).append(" (").append(safe(req.getTeam2Code())).append(")\n")
          .append("세트 스코어: ").append(safe(req.getTeam1Score())).append(" - ").append(safe(req.getTeam2Score())).append("\n");
        if (req.getMatchDate() != null) sb.append("일시: ").append(req.getMatchDate()).append("\n");
        if (req.getBoCount() != null)   sb.append("형식: BO").append(req.getBoCount()).append("\n");

        if (!games.isEmpty()) {
            sb.append("\n[게임별 선수 KDA 및 데미지 기여도]\n");
            for (Game g : games) {
                sb.append("\n게임 ").append(g.getGameNumber()).append(":\n");
                if (g.getWinnerTeam() != null)
                    sb.append("승리팀: ").append(g.getWinnerTeam().getShortName()).append("\n");
                if (g.getDuration() != null) {
                    int min = g.getDuration() / 60, sec = g.getDuration() % 60;
                    sb.append("게임 시간: ").append(min).append("분 ").append(sec).append("초\n");
                }

                List<PlayerGameStat> stats = playerStatRepository.findByGameGameId(g.getGameId());
                if (!stats.isEmpty()) {
                    Long blueId = g.getBlueTeam().getId();
                    appendTeamStats(sb, g.getBlueTeam().getShortName(), "(블루팀)", stats, blueId, true);
                    appendTeamStats(sb, g.getRedTeam().getShortName(),  "(레드팀)",  stats, blueId, false);
                }
            }
        }
        return sb.toString();
    }

    private void appendTeamStats(StringBuilder sb, String code, String label,
                                 List<PlayerGameStat> stats, Long blueId, boolean blue) {
        sb.append(code).append(" ").append(label).append(":\n");
        stats.stream()
            .filter(s -> s.getPlayer().getTeam().getId().equals(blueId) == blue)
            .sorted(Comparator.comparingInt(s -> posOrder(s.getPlayer().getPosition())))
            .forEach(s -> {
                double dmg = s.getTeamDamageRatio() != null ? s.getTeamDamageRatio() : 0.0;
                sb.append(String.format("  [%s] %s%s: %d/%d/%d KDA, 데미지기여도 %.1f%%\n",
                    s.getPlayer().getPosition() != null ? s.getPlayer().getPosition() : "?",
                    s.getPlayer().getNickname(),
                    s.getChampionName() != null ? " (" + s.getChampionName() + ")" : "",
                    nz(s.getKills()), nz(s.getDeaths()), nz(s.getAssists()), dmg));
            });
    }

    private String callGroq(String prompt) throws Exception {
        Map<String, Object> body = Map.of(
            "model", model,
            "messages", List.of(Map.of("role", "user", "content", prompt)),
            "temperature", 0.5,
            "response_format", Map.of("type", "json_object")
        );
        String json = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(GROQ_ENDPOINT))
            .timeout(Duration.ofSeconds(50))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2)
            throw new RuntimeException("Groq API 오류 (status=" + response.statusCode() + "): "
                + truncate(response.body(), 300));
        return response.body();
    }

    private JsonNode parseStructured(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        String inner = root.path("choices").path(0)
                .path("message").path("content").asText("");
        if (inner.isBlank()) throw new RuntimeException("Groq 응답 content가 비어있음");
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

    private static int nz(Integer v) { return v == null ? 0 : v; }
    private static String safe(Object v) { return v == null ? "" : String.valueOf(v); }
    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static int posOrder(String pos) {
        if (pos == null) return 99;
        return switch (pos.toUpperCase()) {
            case "TOP"                   -> 0;
            case "JGL", "JNG", "JUNGLE" -> 1;
            case "MID"                   -> 2;
            case "BOT", "ADC"            -> 3;
            case "SUP", "SUPPORT"        -> 4;
            default                      -> 99;
        };
    }
}
