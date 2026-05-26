package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Player;

public record PlayerResponse(Long id, SportType sportType, Long teamId, String teamName,
                             String playerName, Integer backNumber, String position, String nickname) {
    public static PlayerResponse from(Player p) {
        if (p == null) return null;
        return new PlayerResponse(
                p.getId(),
                p.getSportType(),
                p.getTeam() != null ? p.getTeam().getId() : null,
                p.getTeam() != null ? p.getTeam().getTeamName() : null,
                p.getPlayerName(),
                p.getBackNumber(),
                p.getPosition(),
                p.getNickname()
        );
    }
}
