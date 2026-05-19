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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Collections;
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

    public MatchSectionsResponse findMatchSections(SportType sportType, String leagueName) {
        Pageable top6 = PageRequest.of(0, 6);

        List<MatchResponse> live = matchRepository
                .findTopByStatusDesc(sportType, leagueName, MatchStatus.LIVE, top6)
                .stream().map(MatchResponse::from).toList();

        List<MatchResponse> recent = matchRepository
                .findTopByStatusDesc(sportType, leagueName, MatchStatus.FINAL, top6)
                .stream().map(MatchResponse::from).toList();

        List<MatchResponse> upcoming = matchRepository
                .findTopByStatusAsc(sportType, leagueName, MatchStatus.SCHEDULED, top6)
                .stream().map(MatchResponse::from).toList();

        return MatchSectionsResponse.builder()
                .liveMatches(live)
                .recentFinishedMatches(recent)
                .upcomingMatches(upcoming)
                .build();
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
