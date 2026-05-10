package com.team.sportsanalysis.mlb.records;

import lombok.*;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbTeamStatRow {
    private Integer rank;
    private Long teamId;
    private String teamName;
    @Builder.Default
    private Map<String, Object> stats = new LinkedHashMap<>();
}
