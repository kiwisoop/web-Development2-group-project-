package com.team.sportsanalysis.mlb;

import lombok.*;

// Flat DTO returned to the frontend.
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbGame {
    private Long gamePk;
    private String gameDate;
    private String homeTeam;
    private String awayTeam;
    private Integer homeScore;
    private Integer awayScore;
    private String venue;
    private String status;
}
