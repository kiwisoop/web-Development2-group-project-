package com.sport.web_sport.esports.dto;

import com.sport.web_sport.esports.entity.Game;

public record LckGameSummary(
        Long gameId,
        Integer gameNumber,
        Long blueTeamId,
        String blueTeamName,
        Long redTeamId,
        String redTeamName,
        Long winnerTeamId,
        String winnerTeamName,
        Integer duration
) {
    public static LckGameSummary from(Game g) {
        return new LckGameSummary(
                g.getGameId(),
                g.getGameNumber(),
                g.getBlueTeam().getId(),
                g.getBlueTeam().getTeamName(),
                g.getRedTeam().getId(),
                g.getRedTeam().getTeamName(),
                g.getWinnerTeam() != null ? g.getWinnerTeam().getId() : null,
                g.getWinnerTeam() != null ? g.getWinnerTeam().getTeamName() : null,
                g.getDuration()
        );
    }
}
