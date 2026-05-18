package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.sports.entity.MatchEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MatchEventResponse {
    private Long id;
    private Long teamId;
    private String teamName;
    private Long playerId;
    private String playerName;
    private String eventTime;
    private String eventType;
    private String description;
    private String scoreAfterEvent;

    public static MatchEventResponse from(MatchEvent event) {
        if (event == null) return null;
        return MatchEventResponse.builder()
                .id(event.getId())
                .teamId(event.getTeam() != null ? event.getTeam().getId() : null)
                .teamName(event.getTeam() != null ? event.getTeam().getTeamName() : null)
                .playerId(event.getPlayer() != null ? event.getPlayer().getId() : null)
                .playerName(event.getPlayer() != null ? event.getPlayer().getPlayerName() : null)
                .eventTime(event.getEventTime())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .scoreAfterEvent(event.getScoreAfterEvent())
                .build();
    }
}
