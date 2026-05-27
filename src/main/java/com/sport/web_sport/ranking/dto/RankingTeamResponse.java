package com.sport.web_sport.ranking.dto;

import com.sport.web_sport.common.type.SportType;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder(toBuilder = true)
public class RankingTeamResponse {
    private int rank;
    private Long teamId;
    private String teamName;
    private SportType sportType;
    private String leagueName;
    private String logoUrl;
    private int gamesPlayed;
    private int wins;
    private int draws;
    private int losses;
    private double winRate;
    private int points;
    private int scoresFor;
    private int scoresAgainst;
    private int scoreDifference;
    /** 최근 FINAL 경기 최대 5개의 승/무/패 (과거→최근 순). */
    private List<String> recentForm;
}
