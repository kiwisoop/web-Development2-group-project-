package com.team.sportsanalysis.mlb.records;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbStandingTeam {
    private Long teamId;
    private String teamName;
    private String league;       // e.g. "American League"
    private String division;     // e.g. "AL East"
    private Integer divisionRank;
    private Integer leagueRank;
    private Integer wins;
    private Integer losses;
    private String winningPercentage;
    private String gamesBack;
    private String streak;
    private Integer runsScored;
    private Integer runsAllowed;
    private Integer runDifferential;
}
