package com.team.sportsanalysis.mlb.records;

import lombok.*;

// Highlighted single-team "leader" card (e.g. best winning %, most wins).
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbTeamRecordCard {
    private String label;        // e.g. "Best Winning %"
    private String teamName;
    private Long teamId;
    private String value;        // formatted display value (e.g. ".678", "104", "+205")
}
