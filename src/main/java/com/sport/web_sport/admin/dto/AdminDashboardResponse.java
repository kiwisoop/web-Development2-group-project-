package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AdminDashboardResponse {
    private long totalUsers;
    private long totalMatches;
    private long liveMatches;
    private long totalLeagues;
    private long totalTeams;
    private long totalPlayers;
    private long totalFavoriteTeams;
    private long totalAnalyses;
    private long doneAnalyses;
    private long failedAnalyses;
    private long totalPredictionVotes;
    private List<RecentMatchResponse> recentMatches;
    private List<RecentUserResponse> recentUsers;
    private List<SportMatchCountResponse> matchCountBySportType;
    private List<AnalysisStatusCountResponse> analysisCountByStatus;
}
