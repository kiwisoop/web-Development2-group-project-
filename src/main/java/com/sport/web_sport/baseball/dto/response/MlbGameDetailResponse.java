package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MlbGameDetailResponse {
    private Long matchId;
    private long gamePk;
    private String gameStatus;
    private String homeTeamName;
    private String awayTeamName;
    private String homeTeamLogoUrl;
    private String awayTeamLogoUrl;
    private String homeTeamShortName;
    private String awayTeamShortName;
    private String homeProbablePitcher;
    private String awayProbablePitcher;
    private MlbLinescoreResponse linescore;
    private List<MlbLineupPlayerResponse> homeLineup;
    private List<MlbLineupPlayerResponse> awayLineup;
    private List<MlbBatterStatResponse> homeBatters;
    private List<MlbBatterStatResponse> awayBatters;
    private List<MlbPitcherStatResponse> homePitchers;
    private List<MlbPitcherStatResponse> awayPitchers;
}
