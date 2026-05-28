package com.sport.web_sport.esports.controller;

import com.sport.web_sport.esports.dto.CitoScheduleResponse;
import com.sport.web_sport.esports.dto.LckCitoAnalysisRequest;
import com.sport.web_sport.esports.dto.LckGameResponse;
import com.sport.web_sport.esports.dto.LckGameSummary;
import com.sport.web_sport.esports.dto.PlayerGameStatDetail;
import com.sport.web_sport.esports.dto.PlayerSeasonSummary;
import com.sport.web_sport.esports.service.CitoApiService;
import com.sport.web_sport.esports.service.LckDataService;
import com.sport.web_sport.esports.service.LckGeminiService;
import com.sport.web_sport.sports.dto.response.MatchResponse;
import com.sport.web_sport.sports.dto.response.PlayerResponse;
import com.sport.web_sport.sports.dto.response.TeamResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lck")
@RequiredArgsConstructor
public class LckController {

    private final LckDataService  lckDataService;
    private final CitoApiService  citoApiService;
    private final LckGeminiService lckGeminiService;

    // ── DB 기반 엔드포인트 ───────────────────────────────────────────────────────

    @GetMapping("/teams")
    public ResponseEntity<List<TeamResponse>> getTeams() {
        return ResponseEntity.ok(lckDataService.getLckTeams());
    }

    @GetMapping("/teams/{teamId}/players")
    public ResponseEntity<List<PlayerResponse>> getPlayers(@PathVariable Long teamId) {
        return ResponseEntity.ok(lckDataService.getPlayersByTeam(teamId));
    }

    @GetMapping("/matches/{matchId}/games")
    public ResponseEntity<List<LckGameSummary>> getGames(@PathVariable Long matchId) {
        return ResponseEntity.ok(lckDataService.getGames(matchId));
    }

    @GetMapping("/games/{gameId}")
    public ResponseEntity<LckGameResponse> getGameDetail(@PathVariable Long gameId) {
        return ResponseEntity.ok(lckDataService.getGameDetail(gameId));
    }

    @GetMapping("/players/{playerId}/stats")
    public ResponseEntity<?> getPlayerStats(
            @PathVariable Long playerId,
            @RequestParam(defaultValue = "2025 Spring") String season) {
        return ResponseEntity.ok(lckDataService.getPlayerSeasonStats(playerId, season));
    }

    @GetMapping("/players/{playerId}/career")
    public ResponseEntity<Map<String, Object>> getCareer(@PathVariable Long playerId) {
        return ResponseEntity.ok(lckDataService.getPlayerCareerRecord(playerId));
    }

    /** 선수 시즌별 통합 KDA 요약 */
    @GetMapping("/players/{playerId}/season-summary")
    public ResponseEntity<List<PlayerSeasonSummary>> getPlayerSeasonSummary(@PathVariable Long playerId) {
        return ResponseEntity.ok(lckDataService.getPlayerSeasonSummaries(playerId));
    }

    /** 선수 경기별 상세 지표 (DPM/Gold/Vision/팀 내 데미지 비율) — season 지정 시 필터링 */
    @GetMapping("/players/{playerId}/game-stats")
    public ResponseEntity<List<PlayerGameStatDetail>> getPlayerGameStats(
            @PathVariable Long playerId,
            @RequestParam(required = false) String season) {
        return ResponseEntity.ok(lckDataService.getPlayerGameStatDetails(playerId, season));
    }

    @GetMapping("/matches")
    public ResponseEntity<List<MatchResponse>> getLckMatches() {
        return ResponseEntity.ok(lckDataService.getLckMatches());
    }

    // ── Cito API 프록시 엔드포인트 ────────────────────────────────────────────────

    /** 지원 시즌 목록 */
    @GetMapping("/cito/seasons")
    public ResponseEntity<List<Map<String, String>>> getSeasons() {
        List<Map<String, String>> seasons = List.of(
            season("lol-lck_split_3_2025", "LCK Summer 2025", "2025-07-01", "2025-09-30"),
            season("lol-lck_split_2_2025", "LCK Spring 2025", "2025-03-01", "2025-06-30"),
            season("lol-lck_cup_2025",     "LCK Cup 2025",    "2025-01-01", "2025-02-28")
        );
        return ResponseEntity.ok(seasons);
    }

    /** 팀 정보 + 소속 선수 목록 (DB 기반) */
    @GetMapping("/teams/with-players")
    public ResponseEntity<List<Map<String, Object>>> getTeamsWithPlayers() {
        return ResponseEntity.ok(lckDataService.getTeamsWithPlayers());
    }

    /** 날짜 범위로 경기 결과 조회 */
    @GetMapping("/cito/matches")
    public ResponseEntity<?> getCitoMatches(
            @RequestParam String from,
            @RequestParam String to) {
        CitoScheduleResponse resp = citoApiService.fetchScheduleByDateRange(from, to);
        if (resp == null) return ResponseEntity.status(503).build();
        return ResponseEntity.ok(resp);
    }

    /** 토너먼트 순위표 */
    @GetMapping("/cito/standings/{tournamentId}")
    public ResponseEntity<?> getCitoStandings(@PathVariable String tournamentId) {
        List<Map<String, Object>> standings = citoApiService.fetchStandings(tournamentId);
        if (standings == null) return ResponseEntity.status(503).build();
        return ResponseEntity.ok(standings);
    }

    /** 오늘 예정 경기 */
    @GetMapping("/cito/today")
    public ResponseEntity<CitoScheduleResponse> getCitoToday() {
        CitoScheduleResponse resp = citoApiService.fetchTodaySchedule();
        if (resp == null) return ResponseEntity.status(503).build();
        return ResponseEntity.ok(resp);
    }

    /** 팀 코드 쌍으로 최근 경기 선수별 KDA + 데미지 기여도 조회 (DB 더미 데이터 한정) */
    @GetMapping("/cito/match-player-stats")
    public ResponseEntity<List<Map<String, Object>>> getMatchPlayerStats(
            @RequestParam String team1Code,
            @RequestParam String team2Code) {
        return ResponseEntity.ok(lckGeminiService.getMatchPlayerStats(team1Code, team2Code));
    }

    /** Cito matchId로 게임별 양팀 통계 (kills, gold, towers, dragons, barons, heralds, bans) */
    @GetMapping("/cito/match-games/{matchId}")
    public ResponseEntity<?> getMatchGames(@PathVariable String matchId) {
        List<Map<String, Object>> games = citoApiService.fetchMatchGames(matchId);
        if (games == null) return ResponseEntity.status(503).build();
        return ResponseEntity.ok(games);
    }

    /** Cito 경기 맥락으로 Gemini 경기 요약 생성 */
    @PostMapping("/cito/match/analyze")
    public ResponseEntity<Map<String, Object>> analyzeMatch(@RequestBody LckCitoAnalysisRequest request) {
        return ResponseEntity.ok(lckGeminiService.analyzeMatch(request));
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────────────

    private Map<String, String> season(String id, String name, String from, String to) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("id",   id);
        m.put("name", name);
        m.put("from", from);
        m.put("to",   to);
        return m;
    }
}
