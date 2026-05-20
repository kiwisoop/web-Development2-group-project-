package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.sports.entity.MatchStat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MatchStatResponse {
    private Long id;
    private Long teamId;
    private String teamName;
    private String statName;
    private String statValue;

    public static MatchStatResponse from(MatchStat stat) {
        if (stat == null) return null;
        return MatchStatResponse.builder()
                .id(stat.getId())
                .teamId(stat.getTeam() != null ? stat.getTeam().getId() : null)
                .teamName(stat.getTeam() != null ? stat.getTeam().getTeamName() : null)
                .statName(stat.getStatName())
                .statValue(stat.getStatValue())
                .build();
    }
}
