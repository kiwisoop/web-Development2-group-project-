package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.favorite.entity.FavoriteTeam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class FavoriteTeamResponse {
    private Long id;
    private SportType sportType;
    private Long teamId;
    private String teamName;
    private TeamResponse team;
    private LocalDateTime createdAt;

    public static FavoriteTeamResponse from(FavoriteTeam favorite) {
        if (favorite == null) return null;
        return FavoriteTeamResponse.builder()
                .id(favorite.getId())
                .sportType(favorite.getSportType())
                .teamId(favorite.getTeam() != null ? favorite.getTeam().getId() : null)
                .teamName(favorite.getTeamName())
                .team(TeamResponse.from(favorite.getTeam()))
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
