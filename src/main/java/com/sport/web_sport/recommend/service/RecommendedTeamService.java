package com.sport.web_sport.recommend.service;

import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.analysis.repository.MatchAnalysisRepository;
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
 * 팀/경기/분석 데이터를 재사용하여 프론트 mock 과 동일한 형태로 응답을 만든다.
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
    private final MatchAnalysisRepository matchAnalysisRepository;
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

        // 분석의 기준 경기: 다음 예정 경기 우선, 없으면 가장 최근 종료 경기
        Match upcoming = firstOrNull(
                matchRepository.findUpcomingByTeamId(team.getId(), LocalDateTime.now(), PageRequest.of(0, 1)));
        List<Match> recentFinished =
                matchRepository.findRecentFinishedByTeamId(team.getId(), PageRequest.of(0, RECENT_FORM_SIZE));
        Match analysisBase = (upcoming != null) ? upcoming
                : (recentFinished.isEmpty() ? null : recentFinished.get(0));

        MatchAnalysis analysis = (analysisBase == null) ? null
                : matchAnalysisRepository.findFirstByMatchIdOrderByIdDesc(analysisBase.getId()).orElse(null);

        return RecommendedTeamResponse.builder()
                .id(favorite.getId())
                .teamName(team.getTeamName())
                .sport(team.getSportType() == null ? null : team.getSportType().name())
                .sportLabel(sportLabel(team.getSportType()))
                .league(league == null ? null : league.getLeagueName())
                .ranking(null) // v1: DB 직접 출처 없음
                .nextMatch(buildNextMatch(team.getId(), upcoming))
                .analysisStatus(analysisStatus(analysis))
                .recentForm(buildRecentForm(team.getId(), recentFinished))
                .aiInsight(analysis == null ? null : analysis.getSummaryText())
                .keyPoint(analysis == null ? null : analysis.getKeyPoint())
                .riskFactor(null) // v1: 직접 필드 없음
                .alerts(Collections.emptyList()) // v1
                .build();
    }

    /** 프론트 카드가 nextMatch non-null 을 전제로 하므로 예정 경기가 없어도 객체를 반환한다. */
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

    /** 최근 종료 경기를 시간순(과거→최근)으로 정렬하여 승/무/패 배열 생성. */
    private List<String> buildRecentForm(Long teamId, List<Match> recentFinishedDesc) {
        List<String> form = new ArrayList<>();
        // 리포지토리는 최신순(desc) 이므로 뒤집어 과거→최근 순으로 만든다.
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

    private String analysisStatus(MatchAnalysis analysis) {
        if (analysis == null || analysis.getStatus() == null) {
            return "PENDING";
        }
        return switch (analysis.getStatus()) {
            case DONE -> "READY";
            case GENERATING -> "IN_PROGRESS";
            case NOT_CREATED, FAILED -> "PENDING";
        };
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
