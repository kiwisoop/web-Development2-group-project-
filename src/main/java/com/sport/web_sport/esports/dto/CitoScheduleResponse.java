package com.sport.web_sport.esports.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CitoScheduleResponse {

    private Boolean success;
    private ScheduleData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ScheduleData {
        private String leagueId;
        private String leagueName;
        private Integer total;
        private Integer count;
        private Boolean hasMore;
        private List<MatchEvent> events;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MatchEvent {
        private String startTime;
        private String state;
        private String type;
        private String blockName;
        private String matchId;
        private List<TeamEntry> teams;
        private Strategy strategy;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TeamEntry {
        private String slug;
        private String name;
        private String code;
        private String imageUrl;
        private Integer score;
        private String outcome;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Strategy {
        private String type;
        private Integer count;
    }
}
