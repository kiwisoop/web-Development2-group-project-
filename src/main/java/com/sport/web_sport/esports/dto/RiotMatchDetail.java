package com.sport.web_sport.esports.dto;

import java.util.List;

public record RiotMatchDetail(
        String id,
        String startTime,
        String state,
        String blockName,
        String season,
        List<RiotMatchSummary.RiotTeamInfo> teams,
        List<RiotGameInfo> games
) {
    public record RiotGameInfo(
            String id,
            int number,
            String state,
            String blueTeamName,
            String blueTeamCode,
            String redTeamName,
            String redTeamCode,
            String winnerCode
    ) {}
}
