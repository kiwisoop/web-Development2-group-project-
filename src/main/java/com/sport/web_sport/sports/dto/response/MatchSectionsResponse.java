package com.sport.web_sport.sports.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MatchSectionsResponse {

    private List<MatchResponse> liveMatches;
    private List<MatchResponse> recentFinishedMatches;
    private List<MatchResponse> upcomingMatches;
}
