package com.sport.web_sport.sports.service;

import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.analysis.service.AnalysisService;
import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.favorite.service.FavoriteTeamService;
import com.sport.web_sport.sports.dto.MatchSearchCondition;
import com.sport.web_sport.sports.dto.response.AnalysisResponse;
import com.sport.web_sport.sports.dto.response.MatchSectionsResponse;
import com.sport.web_sport.sports.dto.response.LeagueResponse;
import com.sport.web_sport.sports.dto.response.MatchDetailFullResponse;
import com.sport.web_sport.sports.dto.response.MatchEventResponse;
import com.sport.web_sport.sports.dto.response.MatchResponse;
import com.sport.web_sport.sports.dto.response.MatchStatResponse;
import com.sport.web_sport.sports.dto.response.TeamResponse;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.MatchEvent;
import com.sport.web_sport.sports.entity.MatchStat;
import com.sport.web_sport.sports.repository.MatchEventRepository;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.MatchStatRepository;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchService {

    private final MatchRepository matchRepository;
    private final MatchStatRepository matchStatRepository;
    private final MatchEventRepository matchEventRepository;
    private final AnalysisService analysisService;
    private final FavoriteTeamService favoriteTeamService;
    private final AuthService authService;

    public List<Match> findAllMatches() {
        return matchRepository.findAll();
    }

    public List<Match> searchMatches(MatchSearchCondition condition) {
        LocalDateTime start = null;
        LocalDateTime end = null;

        if (condition.getDate() != null) {
            LocalDate d = condition.getDate();
            start = d.atStartOfDay();
            end = d.plusDays(1).atStartOfDay();
        } else if (condition.getYear() != null && condition.getMonth() != null) {
            YearMonth ym = YearMonth.of(condition.getYear(), condition.getMonth());
            start = ym.atDay(1).atStartOfDay();
            end = ym.plusMonths(1).atDay(1).atStartOfDay();
        }

        String keyword = condition.getKeyword();
        if (keyword != null && keyword.isBlank()) {
            keyword = null;
        }

        return matchRepository.searchMatches(
                condition.getSportType(),
                condition.getStatus(),
                condition.getLeagueId(),
                condition.getTeamId(),
                start,
                end,
                keyword
        );
    }

    public Match findMatchDetail(Long matchId) {
        return matchRepository.findByIdWithTeams(matchId)
                .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));
    }

    public List<MatchStat> findStatsByMatchId(Long matchId) {
        return matchStatRepository.findByMatchId(matchId);
    }

    public List<MatchEvent> findEventsByMatchId(Long matchId) {
        return matchEventRepository.findByMatchIdOrderByEventTimeAsc(matchId);
    }

    public Page<Match> searchMatchesPaged(MatchSearchCondition condition) {
        LocalDateTime start = null;
        LocalDateTime end = null;

        if (condition.getDate() != null) {
            LocalDate d = condition.getDate();
            start = d.atStartOfDay();
            end = d.plusDays(1).atStartOfDay();
        } else if (condition.getYear() != null && condition.getMonth() != null) {
            YearMonth ym = YearMonth.of(condition.getYear(), condition.getMonth());
            start = ym.atDay(1).atStartOfDay();
            end = ym.plusMonths(1).atDay(1).atStartOfDay();
        }

        String keyword = condition.getKeyword();
        if (keyword != null && keyword.isBlank()) keyword = null;

        int page = condition.getPageOrDefault();
        int size = condition.getSizeOrDefault();
        String sort = condition.getSortOrDefault();

        if ("liveFirst".equals(sort)) {
            Pageable pageable = PageRequest.of(page, size);
            return matchRepository.searchMatchesLiveFirst(
                    condition.getSportType(), condition.getStatus(),
                    condition.getLeagueId(), condition.getTeamId(),
                    start, end, keyword, pageable);
        }

        Sort springSort = "oldest".equals(sort)
                ? Sort.by("matchDate").ascending()
                : Sort.by("matchDate").descending();
        Pageable pageable = PageRequest.of(page, size, springSort);
        return matchRepository.searchMatchesPaged(
                condition.getSportType(), condition.getStatus(),
                condition.getLeagueId(), condition.getTeamId(),
                start, end, keyword, pageable);
    }

    // A match is "actually live" only when its scheduled time is close to now.
    // Status alone is unreliable because syncs/seeds can leave status=LIVE on
    // matches whose scheduled time is days in the past or far in the future.
    private static final Duration LIVE_WINDOW_AFTER_START = Duration.ofHours(4);
    private static final Duration LIVE_WINDOW_BEFORE_START = Duration.ofMinutes(10);

    static boolean isActuallyLive(Match m, LocalDateTime now) {
        if (m.getStatus() != MatchStatus.LIVE) return false;
        LocalDateTime dt = m.getMatchDate();
        if (dt == null) return false;
        return !dt.isBefore(now.minus(LIVE_WINDOW_AFTER_START))
                && !dt.isAfter(now.plus(LIVE_WINDOW_BEFORE_START));
    }

    public MatchSectionsResponse findMatchSections(SportType sportType, String leagueName) {
        LocalDateTime now = LocalDateTime.now();
        Pageable top12 = PageRequest.of(0, 12);

        List<Match> liveByStatus = matchRepository
                .findTopByStatusDesc(sportType, leagueName, MatchStatus.LIVE, top12);
        List<Match> finalByStatus = matchRepository
                .findTopByStatusDesc(sportType, leagueName, MatchStatus.FINAL, top12);
        List<Match> scheduledByStatus = matchRepository
                .findTopByStatusAsc(sportType, leagueName, MatchStatus.SCHEDULED, top12);

        List<Match> actuallyLive = new ArrayList<>();
        List<Match> recentPool = new ArrayList<>(finalByStatus);
        List<Match> upcomingPool = new ArrayList<>(scheduledByStatus);

        // Reclassify LIVE-status matches that fall outside the time window:
        // past stuck-LIVE → recent (if scores), future stuck-LIVE → upcoming.
        for (Match m : liveByStatus) {
            if (isActuallyLive(m, now)) {
                actuallyLive.add(m);
                continue;
            }
            LocalDateTime dt = m.getMatchDate();
            boolean hasScores = m.getHomeScore() != null && m.getAwayScore() != null;
            if (dt != null && dt.isAfter(now.plus(LIVE_WINDOW_BEFORE_START))) {
                upcomingPool.add(m);
            } else if (hasScores) {
                recentPool.add(m);
            }
            // else: null date with no scores — drop silently
        }

        Comparator<Match> byDateDesc = (a, b) -> {
            LocalDateTime da = a.getMatchDate(), db = b.getMatchDate();
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        };
        Comparator<Match> byDateAsc = (a, b) -> {
            LocalDateTime da = a.getMatchDate(), db = b.getMatchDate();
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return da.compareTo(db);
        };
        recentPool.sort(byDateDesc);
        upcomingPool.sort(byDateAsc);

        return MatchSectionsResponse.builder()
                .liveMatches(actuallyLive.stream().limit(6).map(this::toSectionResponse).toList())
                .recentFinishedMatches(recentPool.stream().limit(6).map(this::toSectionResponse).toList())
                .upcomingMatches(upcomingPool.stream().limit(6).map(this::toSectionResponse).toList())
                .build();
    }

    /** 주요 경기 분석에 사용할 최근 경기 개수(최근 N경기 폼). */
    private static final int RECENT_FORM_LIMIT = 5;

    /**
     * 섹션 응답 매핑. 야구(BASEBALL) 경기에만 최근 폼/평균 득실점/연승·연패 분석을 채운다.
     * 축구·E스포츠 등 다른 종목은 기존과 동일하게 기본 정보만 반환한다.
     */
    private MatchResponse toSectionResponse(Match match) {
        MatchResponse response = MatchResponse.from(match);
        if (match.getSportType() == SportType.BASEBALL) {
            enrichBaseballAnalysis(response, match);
        }
        return response;
    }

    /**
     * 야구 경기에 대한 최근 폼·평균 득실점·연승/연패 분석을 계산해 응답에 채운다.
     * - 계산 기준은 match_info 의 FINAL 경기뿐이며, 기준 경기 날짜 이전 경기만 사용한다.
     * - Gemini 등 외부 API나 mock 데이터는 사용하지 않는다.
     */
    private void enrichBaseballAnalysis(MatchResponse response, Match match) {
        LocalDateTime before = match.getMatchDate();
        Pageable recentN = PageRequest.of(0, RECENT_FORM_LIMIT);

        Long homeId = match.getHomeTeam() != null ? match.getHomeTeam().getId() : null;
        Long awayId = match.getAwayTeam() != null ? match.getAwayTeam().getId() : null;
        String homeName = match.getHomeTeam() != null ? match.getHomeTeam().getTeamName() : "홈팀";
        String awayName = match.getAwayTeam() != null ? match.getAwayTeam().getTeamName() : "원정팀";

        TeamForm homeForm = computeTeamForm(homeId, before, recentN);
        TeamForm awayForm = computeTeamForm(awayId, before, recentN);

        response.setHomeRecentForm(homeForm.results());
        response.setAwayRecentForm(awayForm.results());

        List<String> metrics = new ArrayList<>();
        if (homeForm.games() > 0) metrics.add(formatMetric(homeName, homeForm));
        if (awayForm.games() > 0) metrics.add(formatMetric(awayName, awayForm));
        response.setKeyMetrics(metrics);

        response.setMainAnalysisPoint(buildStreakPoint(homeName, homeForm, awayName, awayForm));
    }

    /**
     * 특정 팀의 기준 날짜 이전 FINAL 경기들로 최근 폼/평균 득실점/연승·연패를 계산한다.
     * 데이터가 없으면 게임 수 0의 빈 폼을 반환한다(최대 RECENT_FORM_LIMIT 경기).
     */
    private TeamForm computeTeamForm(Long teamId, LocalDateTime before, Pageable recentN) {
        if (teamId == null) {
            return new TeamForm(new ArrayList<>(), 0, 0, 0, 0, null);
        }

        List<Match> matches = matchRepository.findRecentFinalByTeamBeforeDate(teamId, before, recentN);

        List<String> results = new ArrayList<>();
        int scored = 0;
        int allowed = 0;
        for (Match game : matches) {
            boolean isHome = teamId.equals(game.getHomeTeam().getId());
            Integer my = isHome ? game.getHomeScore() : game.getAwayScore();
            Integer opp = isHome ? game.getAwayScore() : game.getHomeScore();
            if (my == null || opp == null) continue; // 점수 없는 경기는 폼 계산에서 제외
            scored += my;
            allowed += opp;
            results.add(my > opp ? "승" : my < opp ? "패" : "무");
        }

        int games = results.size();
        double avgScored = games > 0 ? (double) scored / games : 0;
        double avgAllowed = games > 0 ? (double) allowed / games : 0;

        // 최신 경기(리스트 앞쪽)부터 동일 결과가 이어지는 길이로 연승/연패 산출
        int streakCount = 0;
        String streakType = null;
        if (!results.isEmpty()) {
            streakType = results.get(0);
            for (String r : results) {
                if (r.equals(streakType)) streakCount++;
                else break;
            }
        }

        return new TeamForm(results, games, avgScored, avgAllowed, streakCount, streakType);
    }

    private String formatMetric(String teamName, TeamForm form) {
        return String.format("%s 최근 %d경기 평균 득점 %.1f · 실점 %.1f",
                teamName, form.games(), form.avgScored(), form.avgAllowed());
    }

    /**
     * 연승/연패 기반 한 줄 분석 포인트.
     * - 2경기 이상 연승/연패인 팀만 표기하고 둘 다 해당하면 ' · '로 연결한다.
     * - 양 팀 모두 최근 경기 데이터가 없으면 "최근 경기 데이터 부족"을 반환한다.
     * - 데이터는 있으나 두드러진 연승/연패가 없으면 null(미표기).
     */
    private String buildStreakPoint(String homeName, TeamForm homeForm, String awayName, TeamForm awayForm) {
        List<String> parts = new ArrayList<>();
        addStreakPart(parts, homeName, homeForm);
        addStreakPart(parts, awayName, awayForm);

        if (!parts.isEmpty()) {
            return String.join(" · ", parts);
        }
        if (homeForm.games() == 0 && awayForm.games() == 0) {
            return "최근 경기 데이터 부족";
        }
        return null;
    }

    private void addStreakPart(List<String> parts, String teamName, TeamForm form) {
        if (form.games() == 0 || form.streakCount() < 2) return;
        if ("승".equals(form.streakType())) {
            parts.add(teamName + " " + form.streakCount() + "연승 중");
        } else if ("패".equals(form.streakType())) {
            parts.add(teamName + " " + form.streakCount() + "연패 중");
        }
    }

    /** 한 팀의 최근 폼 집계 결과(내부 계산용). */
    private record TeamForm(List<String> results, int games,
                            double avgScored, double avgAllowed,
                            int streakCount, String streakType) {
    }

    public List<Match> findMatchesByFavoriteTeams(HttpSession session) {
        List<Long> teamIds = favoriteTeamService.getFavoriteTeamIds(session);
        if (teamIds == null || teamIds.isEmpty()) return Collections.emptyList();
        return matchRepository.findMatchesByTeamIds(teamIds, PageRequest.of(0, 10));
    }

    public MatchDetailFullResponse findDetailFull(Long matchId, HttpSession session) {
        Match match = findMatchDetail(matchId);
        List<MatchStat> stats = findStatsByMatchId(matchId);
        List<MatchEvent> events = findEventsByMatchId(matchId);
        Optional<MatchAnalysis> saved = analysisService.getSavedAnalysis(matchId, AnalysisProvider.GEMINI);
        MatchAnalysis analysis = saved.orElse(null);
        AnalysisStatus status = analysis != null ? analysis.getStatus() : AnalysisStatus.NOT_CREATED;

        boolean loggedIn = authService.getLoginUserId(session) != null;
        Long homeTeamId = match.getHomeTeam() != null ? match.getHomeTeam().getId() : null;
        Long awayTeamId = match.getAwayTeam() != null ? match.getAwayTeam().getId() : null;
        boolean homeFav = loggedIn && favoriteTeamService.isFavoriteTeam(homeTeamId, session);
        boolean awayFav = loggedIn && favoriteTeamService.isFavoriteTeam(awayTeamId, session);

        return MatchDetailFullResponse.builder()
                .match(MatchResponse.from(match))
                .homeTeam(TeamResponse.from(match.getHomeTeam()))
                .awayTeam(TeamResponse.from(match.getAwayTeam()))
                .league(LeagueResponse.from(match.getLeague()))
                .stats(stats.stream().map(MatchStatResponse::from).toList())
                .events(events.stream().map(MatchEventResponse::from).toList())
                .analysis(analysis != null ? AnalysisResponse.from(analysis) : AnalysisResponse.notCreated())
                .analysisStatus(status)
                .homeTeamFavorite(homeFav)
                .awayTeamFavorite(awayFav)
                .loggedIn(loggedIn)
                .build();
    }
}
