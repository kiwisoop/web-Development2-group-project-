package com.team.sportsanalysis.mlb.records;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbStatLeader {
    private Integer rank;
    private Long playerId;
    private String playerName;
    private Long teamId;
    private String teamName;
    private String value;        // raw value string (e.g. "0.345", "42")
}
