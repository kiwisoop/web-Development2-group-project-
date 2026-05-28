package com.sport.web_sport.esports.dto;

import java.util.List;

public record RiotMatchSummary(
        String id,
        String startTime,
        String state,
        String blockName,
        String season,
        List<RiotTeamInfo> teams
) {
    public record RiotTeamInfo(
            String name,
            String code,
            String image,
            int gameWins
    ) {}
}
