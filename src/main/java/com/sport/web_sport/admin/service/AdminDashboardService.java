package com.sport.web_sport.admin.service;

import com.sport.web_sport.admin.dto.AdminDashboardResponse;
import com.sport.web_sport.admin.dto.RecentMatchResponse;
import com.sport.web_sport.admin.dto.RecentUserResponse;
import com.sport.web_sport.admin.dto.SportMatchCountResponse;
import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.favorite.repository.FavoriteTeamRepository;
import com.sport.web_sport.prediction.repository.PredictionVoteRepository;
import com.sport.web_sport.sports.repository.LeagueRepository;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.PlayerRepository;
import com.sport.web_sport.sports.repository.TeamRepository;
import com.sport.web_sport.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final LeagueRepository leagueRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final FavoriteTeamRepository favoriteTeamRepository;
    private final PredictionVoteRepository predictionVoteRepository;

    public AdminDashboardResponse buildDashboard() {
        List<RecentMatchResponse> recentMatches = matchRepository
                .findTop10WithTeams(PageRequest.of(0, 5))
                .stream()
                .map(m -> RecentMatchResponse.builder()
                        .matchId(m.getId())
                        .homeTeamName(m.getHomeTeam().getTeamName())
                        .awayTeamName(m.getAwayTeam().getTeamName())
                        .sportType(m.getSportType().name())
                        .status(m.getStatus().name())
                        .matchDate(m.getMatchDate())
                        .homeScore(m.getHomeScore())
                        .awayScore(m.getAwayScore())
                        .build())
                .collect(Collectors.toList());

        List<RecentUserResponse> recentUsers = userRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(u -> RecentUserResponse.builder()
                        .userId(u.getId())
                        .username(u.getUsername())
                        .nickname(u.getNickname())
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<SportMatchCountResponse> matchCountBySportType = Arrays.stream(SportType.values())
                .map(st -> SportMatchCountResponse.builder()
                        .sportType(st.name())
                        .count(matchRepository.countBySportType(st))
                        .build())
                .collect(Collectors.toList());

        return AdminDashboardResponse.builder()
                .totalUsers(userRepository.count())
                .totalMatches(matchRepository.count())
                .liveMatches(matchRepository.countByStatus(MatchStatus.LIVE))
                .totalLeagues(leagueRepository.count())
                .totalTeams(teamRepository.count())
                .totalPlayers(playerRepository.count())
                .totalFavoriteTeams(favoriteTeamRepository.count())
                .totalPredictionVotes(predictionVoteRepository.count())
                .recentMatches(recentMatches)
                .recentUsers(recentUsers)
                .matchCountBySportType(matchCountBySportType)
                .build();
    }
}
