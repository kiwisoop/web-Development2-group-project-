package com.team.sportsanalysis.mlb;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbGameDetail {
    private Long gamePk;
    private String gameDate;
    private String status;
    private String venue;

    private String homeTeam;
    private String awayTeam;

    private Integer homeScore;
    private Integer awayScore;

    private Integer currentInning;
    private String inningHalf;

    private Integer awayHits;
    private Integer homeHits;
    private Integer awayErrors;
    private Integer homeErrors;

    private List<MlbInningScore> innings;
    private List<MlbGameEvent> events;
}
