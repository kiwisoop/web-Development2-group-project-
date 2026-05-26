package com.sport.web_sport.soccer.dto.response;

import com.sport.web_sport.soccer.entity.Standing;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class StandingResponse {
    // Field names mirror RankingTeamResponse so frontend RankingTable can render this unchanged.
    private int rank;
    private String teamId;
    private String teamName;
    private String leagueName;
    private String season;
    private int gamesPlayed;
    private int wins;
    private int draws;
    private int losses;
    private double winRate;
    private int points;
    private int scoresFor;
    private int scoresAgainst;
    private int scoreDifference;
    private String standingDesc;

    public static StandingResponse from(Standing s, String leagueName) {
        if (s == null) return null;
        int played = nz(s.getPlayed());
        int wins = nz(s.getWins());
        double winRate = played > 0 ? Math.round(wins * 1000.0 / played) / 10.0 : 0.0;
        return StandingResponse.builder()
                .rank(nz(s.getRankPosition()))
                .teamId(s.getTeamId())
                .teamName(s.getTeamName())
                .leagueName(leagueName)
                .season(s.getSeason())
                .gamesPlayed(played)
                .wins(wins)
                .draws(nz(s.getDraws()))
                .losses(nz(s.getLosses()))
                .winRate(winRate)
                .points(nz(s.getPoints()))
                .scoresFor(nz(s.getGoalsFor()))
                .scoresAgainst(nz(s.getGoalsAgainst()))
                .scoreDifference(nz(s.getGoalDiff()))
                .standingDesc(s.getStandingDesc())
                .build();
    }

    private static int nz(Integer v) { return v == null ? 0 : v; }
}
