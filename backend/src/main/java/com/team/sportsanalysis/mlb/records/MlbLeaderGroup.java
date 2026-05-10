package com.team.sportsanalysis.mlb.records;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbLeaderGroup {
    private String category;     // e.g. "homeRuns"
    private String label;        // e.g. "Home Runs"
    private List<MlbStatLeader> leaders;
}
