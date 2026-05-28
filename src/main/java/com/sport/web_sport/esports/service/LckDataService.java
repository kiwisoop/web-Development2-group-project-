package com.sport.web_sport.esports.service;

import com.sport.web_sport.esports.dto.LckGameResponse;
import com.sport.web_sport.esports.dto.LckGameSummary;
import com.sport.web_sport.esports.dto.PlayerGameStatDetail;
import com.sport.web_sport.esports.dto.PlayerSeasonSummary;
import com.sport.web_sport.esports.entity.*;
import com.sport.web_sport.esports.repository.*;
import com.sport.web_sport.sports.dto.response.MatchResponse;
import com.sport.web_sport.sports.dto.response.PlayerResponse;
import com.sport.web_sport.sports.dto.response.TeamResponse;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.Player;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.PlayerRepository;
import com.sport.web_sport.sports.repository.TeamRepository;
import com.sport.web_sport.common.type.SportType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LckDataService {

    private final GameRepository              gameRepository;
    private final PlayerGameStatRepository    playerGameStatRepository;
    private final TeamGameStatRepository      teamGameStatRepository;
    private final LckTimelineEventRepository  timelineEventRepository;
    private final LckAnalysisResultRepository analysisResultRepository;
    private final TeamRepository              teamRepository;
    private final PlayerRepository            playerRepository;
    private final MatchRepository             matchRepository;

    /** 매치에 속한 모든 게임 목록 (DTO) */
    public List<LckGameSummary> getGames(Long matchId) {
        return gameRepository.findByMatchIdWithTeams(matchId).stream()
                .map(LckGameSummary::from)
                .toList();
    }

    /** 특정 게임 상세 */
    public LckGameResponse getGameDetail(Long gameId) {
        Game game = gameRepository.findById(gameId)
            .orElseThrow(() -> new NoSuchElementException("게임을 찾을 수 없습니다: " + gameId));

        List<PlayerGameStat> allPlayerStats = playerGameStatRepository.findByGameGameId(gameId);
        List<TeamGameStat>   teamStats      = teamGameStatRepository.findByGameGameId(gameId);
        List<LckTimelineEvent> timeline     = timelineEventRepository.findByGameGameIdOrderByEventTime(gameId);
        LckAnalysisResult analysis          = analysisResultRepository.findByGameGameId(gameId).orElse(null);

        Long blueId = game.getBlueTeam().getId();
        List<PlayerGameStat> blueStats = allPlayerStats.stream()
            .filter(s -> s.getPlayer().getTeam().getId().equals(blueId)).toList();
        List<PlayerGameStat> redStats  = allPlayerStats.stream()
            .filter(s -> !s.getPlayer().getTeam().getId().equals(blueId)).toList();

        TeamGameStat blueStat = teamStats.stream()
            .filter(t -> t.getTeam().getId().equals(blueId)).findFirst().orElse(null);
        TeamGameStat redStat  = teamStats.stream()
            .filter(t -> !t.getTeam().getId().equals(blueId)).findFirst().orElse(null);

        return LckGameResponse.from(game, blueStats, redStats, blueStat, redStat, timeline, analysis);
    }

    /** LCK 팀 목록 (DTO) */
    public List<TeamResponse> getLckTeams() {
        return teamRepository.findBySportType(SportType.ESPORTS).stream()
                .map(TeamResponse::from)
                .toList();
    }

    /** 팀 소속 선수 목록 (DTO) */
    public List<PlayerResponse> getPlayersByTeam(Long teamId) {
        return playerRepository.findByTeamId(teamId).stream()
                .map(PlayerResponse::from)
                .toList();
    }

    /** LCK 경기 목록 (DTO) */
    public List<MatchResponse> getLckMatches() {
        return matchRepository.findBySportTypeWithTeams(SportType.ESPORTS).stream()
                .map(MatchResponse::from)
                .toList();
    }

    /** 선수 시즌 통계 (Entity 그대로 반환 — 레거시) */
    public List<PlayerGameStat> getPlayerSeasonStats(Long playerId, String season) {
        return playerGameStatRepository.findByPlayerAndSeason(playerId, season);
    }

    /** 선수의 시즌별 통합 KDA 요약 (시즌이 여러 개면 시즌별로 묶음) */
    public List<PlayerSeasonSummary> getPlayerSeasonSummaries(Long playerId) {
        List<PlayerGameStat> all = playerGameStatRepository.findAllByPlayerWithGame(playerId);
        if (all.isEmpty()) return List.of();

        Player player = all.get(0).getPlayer();

        // 시즌별 그룹핑 (시즌 라벨 없으면 "Unknown")
        Map<String, List<PlayerGameStat>> bySeason = all.stream()
            .collect(Collectors.groupingBy(
                s -> {
                    String season = s.getGame().getMatch().getSeason();
                    return season != null ? season : "Unknown";
                },
                LinkedHashMap::new,
                Collectors.toList()
            ));

        List<PlayerSeasonSummary> result = new ArrayList<>();
        for (Map.Entry<String, List<PlayerGameStat>> entry : bySeason.entrySet()) {
            String season = entry.getKey();
            List<PlayerGameStat> stats = entry.getValue();

            int games  = stats.size();
            int kills  = stats.stream().mapToInt(s -> nz(s.getKills())).sum();
            int deaths = stats.stream().mapToInt(s -> nz(s.getDeaths())).sum();
            int assist = stats.stream().mapToInt(s -> nz(s.getAssists())).sum();

            int wins = (int) stats.stream().filter(this::isWin).count();
            int losses = games - wins;

            double avgK = round1((double) kills / games);
            double avgD = round1((double) deaths / games);
            double avgA = round1((double) assist / games);
            double kda  = round2((double) (kills + assist) / Math.max(deaths, 1));
            double winRate = round1(wins * 100.0 / games);

            result.add(new PlayerSeasonSummary(
                season,
                playerId,
                player.getNickname(),
                player.getPosition(),
                games, kills, deaths, assist,
                avgK, avgD, avgA, kda,
                wins, losses, winRate
            ));
        }
        // 최신 시즌이 위로 오도록 단순 역순 (정확한 시즌 정렬은 DataInitializer 라벨에 의존)
        result.sort((a, b) -> b.season().compareTo(a.season()));
        return result;
    }

    /** 선수의 경기별 상세 지표 (시즌 미지정 시 전체) */
    public List<PlayerGameStatDetail> getPlayerGameStatDetails(Long playerId, String season) {
        List<PlayerGameStat> all = playerGameStatRepository.findAllByPlayerWithGame(playerId);

        return all.stream()
            .filter(s -> season == null || season.isBlank()
                     || season.equals(s.getGame().getMatch().getSeason()))
            .map(s -> toDetail(s))
            .toList();
    }

    private PlayerGameStatDetail toDetail(PlayerGameStat s) {
        Game game = s.getGame();
        Match match = game.getMatch();
        Long myTeamId = s.getPlayer().getTeam().getId();

        Team opponent = null;
        if (match.getHomeTeam() != null && match.getHomeTeam().getId().equals(myTeamId)) {
            opponent = match.getAwayTeam();
        } else if (match.getAwayTeam() != null && match.getAwayTeam().getId().equals(myTeamId)) {
            opponent = match.getHomeTeam();
        }

        return new PlayerGameStatDetail(
            game.getGameId(),
            match.getId(),
            game.getGameNumber(),
            match.getMatchDate(),
            match.getSeason(),
            opponent != null ? opponent.getTeamName()  : "-",
            opponent != null ? opponent.getShortName() : "-",
            isWin(s),
            s.getChampionName(),
            nz(s.getKills()), nz(s.getDeaths()), nz(s.getAssists()),
            nz(s.getCs()),
            nz(s.getGold()),
            nz(s.getDamage()),
            nzd(s.getDpm()),
            nzd(s.getTeamDamageRatio()),
            nz(s.getVisionScore()),
            game.getDuration()
        );
    }

    private static int    nz(Integer v) { return v == null ? 0 : v; }
    private static double nzd(Double v) { return v == null ? 0.0 : v; }
    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    /** 선수 통산 전적 (전체 게임에서 승/패 계산) */
    public Map<String, Object> getPlayerCareerRecord(Long playerId) {
        List<PlayerGameStat> all = playerGameStatRepository.findByPlayerIdOrderByGameGameId(playerId);
        long wins  = all.stream().filter(s -> isWin(s)).count();
        long total = all.size();
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("totalGames", total);
        record.put("wins",  wins);
        record.put("losses", total - wins);
        record.put("winRate", total == 0 ? 0.0 : Math.round(wins * 1000.0 / total) / 10.0);
        return record;
    }

    /** LCK 팀 목록 + 소속 선수 명단 (DB 기반, shortName 기준 중복 제거) */
    public List<Map<String, Object>> getTeamsWithPlayers() {
        List<Team> allTeams = teamRepository.findBySportType(SportType.ESPORTS);
        // shortName 중복 시 id가 가장 큰(최신) 팀만 남긴다
        Map<String, Team> uniqueByCode = new LinkedHashMap<>();
        for (Team t : allTeams) {
            String key = t.getShortName() != null ? t.getShortName().toUpperCase() : String.valueOf(t.getId());
            uniqueByCode.merge(key, t, (existing, newer) ->
                newer.getId() > existing.getId() ? newer : existing);
        }
        List<Team> teams = new ArrayList<>(uniqueByCode.values());
        return teams.stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("teamId",    t.getId());
            m.put("teamName",  t.getTeamName());
            m.put("shortName", t.getShortName());
            m.put("logoUrl",   t.getLogoUrl());

            List<Map<String, String>> players = playerRepository.findByTeamId(t.getId()).stream()
                .sorted(Comparator.comparingInt(p -> posOrder(p.getPosition())))
                .map(p -> {
                    Map<String, String> pm = new LinkedHashMap<>();
                    pm.put("id",         String.valueOf(p.getId()));
                    pm.put("nickname",   p.getNickname()    != null ? p.getNickname()   : "");
                    pm.put("playerName", p.getPlayerName()  != null ? p.getPlayerName() : "");
                    pm.put("position",   p.getPosition()    != null ? p.getPosition()   : "");
                    return pm;
                }).toList();

            m.put("players", players);
            return m;
        }).toList();
    }

    private int posOrder(String pos) {
        if (pos == null) return 99;
        return switch (pos.toUpperCase()) {
            case "TOP"                      -> 0;
            case "JGL", "JNG", "JUNGLE"    -> 1;
            case "MID"                      -> 2;
            case "BOT", "ADC"               -> 3;
            case "SUP", "SUPPORT"           -> 4;
            default                         -> 99;
        };
    }

    private boolean isWin(PlayerGameStat stat) {
        Game game = stat.getGame();
        if (game.getWinnerTeam() == null) return false;
        Long playerTeamId = stat.getPlayer().getTeam().getId();
        return game.getWinnerTeam().getId().equals(playerTeamId);
    }
}
