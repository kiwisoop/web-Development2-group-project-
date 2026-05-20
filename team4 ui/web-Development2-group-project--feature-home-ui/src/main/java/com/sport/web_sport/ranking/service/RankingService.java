package com.sport.web_sport.ranking.service;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.ranking.dto.RankingTeamResponse;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    @Transactional(readOnly = true)
    public List<RankingTeamResponse> getRankings(SportType sportType) {
        List<Team> teams = teamRepository.findBySportTypeWithLeague(sportType);
        List<Match> finalMatches = matchRepository.findBySportTypeAndStatusWithTeams(sportType, MatchStatus.FINAL);

        // Accumulator map: teamId → [wins, draws, losses, scoresFor, scoresAgainst, points]
        Map<Long, int[]> acc = new LinkedHashMap<>();
        Map<Long, Team> teamMap = new HashMap<>();

        for (Team t : teams) {
            acc.put(t.getId(), new int[6]);
            teamMap.put(t.getId(), t);
        }

        for (Match m : finalMatches) {
            Long homeId = m.getHomeTeam().getId();
            Long awayId = m.getAwayTeam().getId();
            int hs = m.getHomeScore() != null ? m.getHomeScore() : 0;
            int as = m.getAwayScore() != null ? m.getAwayScore() : 0;

            // Include teams that appear in matches but are not in the team list
            acc.putIfAbsent(homeId, new int[6]);
            acc.putIfAbsent(awayId, new int[6]);
            teamMap.putIfAbsent(homeId, m.getHomeTeam());
            teamMap.putIfAbsent(awayId, m.getAwayTeam());

            int[] home = acc.get(homeId);
            int[] away = acc.get(awayId);

            // indices: [0]=wins [1]=draws [2]=losses [3]=scoresFor [4]=scoresAgainst [5]=points
            home[3] += hs;
            home[4] += as;
            away[3] += as;
            away[4] += hs;

            if (hs > as) {
                home[0]++;
                away[2]++;
                if (sportType == SportType.SOCCER) {
                    home[5] += 3;
                }
            } else if (hs < as) {
                away[0]++;
                home[2]++;
                if (sportType == SportType.SOCCER) {
                    away[5] += 3;
                }
            } else {
                home[1]++;
                away[1]++;
                if (sportType == SportType.SOCCER) {
                    home[5]++;
                    away[5]++;
                }
            }
        }

        List<RankingTeamResponse> list = new ArrayList<>();
        for (Map.Entry<Long, int[]> e : acc.entrySet()) {
            Long teamId = e.getKey();
            int[] s = e.getValue();
            Team team = teamMap.get(teamId);
            if (team == null) continue;

            int wins = s[0], draws = s[1], losses = s[2];
            int scoresFor = s[3], scoresAgainst = s[4], points = s[5];
            int gamesPlayed = wins + draws + losses;
            double winRate = gamesPlayed > 0 ? Math.round(wins * 1000.0 / gamesPlayed) / 10.0 : 0.0;
            String leagueName = team.getLeague() != null ? team.getLeague().getLeagueName() : null;

            list.add(RankingTeamResponse.builder()
                    .rank(0)
                    .teamId(teamId)
                    .teamName(team.getTeamName())
                    .sportType(sportType)
                    .leagueName(leagueName)
                    .gamesPlayed(gamesPlayed)
                    .wins(wins)
                    .draws(draws)
                    .losses(losses)
                    .winRate(winRate)
                    .points(points)
                    .scoresFor(scoresFor)
                    .scoresAgainst(scoresAgainst)
                    .scoreDifference(scoresFor - scoresAgainst)
                    .build());
        }

        // Sort by sport-specific rules
        if (sportType == SportType.SOCCER) {
            // 1. points desc  2. wins desc  3. scoreDiff desc  4. scoresFor desc  5. teamName asc
            list.sort((a, b) -> {
                if (b.getPoints() != a.getPoints()) return b.getPoints() - a.getPoints();
                if (b.getWins() != a.getWins()) return b.getWins() - a.getWins();
                if (b.getScoreDifference() != a.getScoreDifference()) return b.getScoreDifference() - a.getScoreDifference();
                if (b.getScoresFor() != a.getScoresFor()) return b.getScoresFor() - a.getScoresFor();
                return a.getTeamName().compareTo(b.getTeamName());
            });
        } else {
            // 1. winRate desc  2. wins desc  3. scoreDiff desc  4. scoresFor desc  5. teamName asc
            list.sort((a, b) -> {
                int cmp = Double.compare(b.getWinRate(), a.getWinRate());
                if (cmp != 0) return cmp;
                if (b.getWins() != a.getWins()) return b.getWins() - a.getWins();
                if (b.getScoreDifference() != a.getScoreDifference()) return b.getScoreDifference() - a.getScoreDifference();
                if (b.getScoresFor() != a.getScoresFor()) return b.getScoresFor() - a.getScoresFor();
                return a.getTeamName().compareTo(b.getTeamName());
            });
        }

        // Assign rank using toBuilder() — rank was 0 before sort
        List<RankingTeamResponse> ranked = new ArrayList<>(list.size());
        for (int i = 0; i < list.size(); i++) {
            ranked.add(list.get(i).toBuilder().rank(i + 1).build());
        }
        return ranked;
    }
}
