package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Match;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class MatchResponse {
    private Long id;
    private SportType sportType;
    private MatchStatus status;
    private String season;
    private LocalDateTime matchDate;
    private String venue;
    private Integer homeScore;
    private Integer awayScore;
    private LeagueResponse league;
    private TeamResponse homeTeam;
    private TeamResponse awayTeam;

    /**
     * 야구(BASEBALL) 경기에만 채워지는 최근 폼/분석 필드.
     * - 다른 종목이나 분석 데이터가 없는 경우 null 또는 빈 값으로 둔다.
     * - FeaturedMatches 프론트의 동일 이름 슬롯에 그대로 매핑된다.
     */
    private List<String> homeRecentForm;
    private List<String> awayRecentForm;
    private List<String> keyMetrics;
    private String mainAnalysisPoint;

    public static MatchResponse from(Match match) {
        if (match == null) return null;
        return MatchResponse.builder()
                .id(match.getId())
                .sportType(match.getSportType())
                .status(match.getStatus())
                .season(match.getSeason())
                .matchDate(match.getMatchDate())
                .venue(match.getVenue())
                .homeScore(match.getHomeScore())
                .awayScore(match.getAwayScore())
                .league(LeagueResponse.from(match.getLeague()))
                .homeTeam(TeamResponse.from(match.getHomeTeam()))
                .awayTeam(TeamResponse.from(match.getAwayTeam()))
                .build();
    }
}
