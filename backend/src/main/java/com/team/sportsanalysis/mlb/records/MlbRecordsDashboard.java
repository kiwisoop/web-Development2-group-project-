package com.team.sportsanalysis.mlb.records;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MlbRecordsDashboard {
    private Integer season;
    private List<MlbStandingTeam> standings;
    private List<MlbTeamRecordCard> teamRecordCards;
    private List<MlbLeaderGroup> hittingLeaders;
    private List<MlbLeaderGroup> pitchingLeaders;
}
