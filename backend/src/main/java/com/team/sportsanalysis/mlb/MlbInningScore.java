package com.team.sportsanalysis.mlb;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbInningScore {
    private Integer inning;
    private Integer awayRuns;
    private Integer homeRuns;
}
