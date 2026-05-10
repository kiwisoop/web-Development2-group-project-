package com.team.sportsanalysis.mlb;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbGameEvent {
    private Integer inning;
    private String halfInning;
    private String description;
    private Integer awayScore;
    private Integer homeScore;
    private Boolean scoringPlay;
}
