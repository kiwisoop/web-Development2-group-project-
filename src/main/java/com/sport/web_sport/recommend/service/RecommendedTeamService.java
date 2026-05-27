package com.sport.web_sport.recommend.service;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.favorite.entity.FavoriteTeam;
import com.sport.web_sport.favorite.repository.FavoriteTeamRepository;
import com.sport.web_sport.recommend.dto.RecommendedTeamResponse;
import com.sport.web_sport.sports.entity.League;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 추천팀(맞춤 분석) 조회 서비스.
 *
 * 사용자의 즐겨찾기 팀({@link FavoriteTeam})을 추천팀으로 보고, 기존 DB의
 * 팀/경기 데이터를 재사용하여 프론트 mock 과 동일한 형태로 응답을 만든다.
 * (조회 전용 — 추가/삭제는 본 단계 범위 밖)
 */
@Service
@RequiredArgsConstructor
public class RecommendedTeamService {

    private static final int RECENT_FORM_SIZE = 5;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("M월 d일 HH:mm");

    private final FavoriteTeamRepository favoriteTeamRepository;
    private final MatchRepository matchRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<RecommendedTeamResponse> getRecommendedTeams(HttpSession session) {
        Long userId = authService.requireLoginUserId(session);
        List<FavoriteTeam> favorites = favoriteTeamRepository.findByUserIdWithTeamAndLeague(userId);

        List<RecommendedTeamResponse> result = new ArrayList<>();
        for (FavoriteTeam favorite : favorites) {
            result.add(toResponse(favorite));
        }
        return result;
    }

    private RecommendedTeamResponse toResponse(FavoriteTeam favorite) {
        Team team = favorite.getTeam();
        League league = team.getLeague();

        Match upcoming = firstOrNull(
                matchRepository.findUpcomingByTeamId(team.getId(), LocalDateTime.now(), PageRequest.of(0, 1)));
        List<Match> recentFinished =
                matchRepository.findRecentFinishedByTeamId(team.getId(), PageRequest.of(0, RECENT_FORM_SIZE));

        return RecommendedTeamResponse.builder()
                .id(favorite.getId())
                .teamName(team.getTeamName())
                .sport(team.getSportType() == null ? null : team.getSportType().name())
                .sportLabel(sportLabel(team.getSportType()))
                .league(league == null ? null : league.getLeagueName())
                .ranking(null)
                .nextMatch(buildNextMatch(team.getId(), upcoming))
                .analysisStatus("PENDING")
                .recentForm(buildRecentForm(team.getId(), recentFinished))
                .aiInsight(null)
                .keyPoint(null)
                .riskFactor(null)
                .alerts(Collections.emptyList())
                .build();
    }

    private RecommendedTeamResponse.NextMatch buildNextMatch(Long teamId, Match upcoming) {
        if (upcoming == null) {
            return RecommendedTeamResponse.NextMatch.builder()
                    .opponent("미정")
                    .dateTime("일정 미정")
                    .build();
        }
        Team opponent = opponentOf(teamId, upcoming);
        return RecommendedTeamResponse.NextMatch.builder()
                .opponent(opponent == null ? "미정" : opponent.getTeamName())
                .dateTime(formatMatchDate(upcoming.getMatchDate()))
                .build();
    }

    private List<String> buildRecentForm(Long teamId, List<Match> recentFinishedDesc) {
        List<String> form = new ArrayList<>();
        List<Match> chronological = new ArrayList<>(recentFinishedDesc);
        Collections.reverse(chronological);
        for (Match m : chronological) {
            String r = resultFor(teamId, m);
            if (r != null) {
                form.add(r);
            }
        }
        return form;
    }

    private String resultFor(Long teamId, Match m) {
        Integer home = m.getHomeScore();
        Integer away = m.getAwayScore();
        if (home == null || away == null
                || m.getHomeTeam() == null || m.getAwayTeam() == null) {
            return null;
        }
        boolean isHome = teamId.equals(m.getHomeTeam().getId());
        int mine = isHome ? home : away;
        int theirs = isHome ? away : home;
        if (mine > theirs) return "승";
        if (mine < theirs) return "패";
        return "무";
    }

    private Team opponentOf(Long teamId, Match m) {
        if (m.getHomeTeam() != null && teamId.equals(m.getHomeTeam().getId())) {
            return m.getAwayTeam();
        }
        return m.getHomeTeam();
    }

    private String sportLabel(SportType type) {
        if (type == null) {
            return null;
        }
        return switch (type) {
            case SOCCER -> "축구";
            case BASEBALL -> "야구";
            case ESPORTS -> "E스포츠";
        };
    }

    private String formatMatchDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "일정 미정";
        }
        LocalDateTime now = LocalDateTime.now();
        if (dateTime.toLocalDate().isEqual(now.toLocalDate())) {
            return "오늘 " + dateTime.format(TIME_FMT);
        }
        return dateTime.format(DATE_FMT);
    }

    private Match firstOrNull(List<Match> matches) {
        return (matches == null || matches.isEmpty()) ? null : matches.get(0);
    }
}
