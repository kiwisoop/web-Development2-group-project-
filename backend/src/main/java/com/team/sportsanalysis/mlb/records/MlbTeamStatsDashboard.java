package com.team.sportsanalysis.mlb.records;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbTeamStatsDashboard {
    private Integer season;
    private List<MlbTeamStatRow> batting;
    private List<MlbTeamStatRow> pitching;
    private List<MlbTeamStatRow> fielding;
}
