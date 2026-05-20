package com.sport.web_sport.prediction.dto;

import com.sport.web_sport.prediction.VoteOption;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PredictionResultResponse {
    private Long matchId;
    private long totalVotes;
    private long homeWinCount;
    private long drawCount;
    private long awayWinCount;
    private double homeWinPercent;
    private double drawPercent;
    private double awayWinPercent;
    private VoteOption myVote;
    private boolean canVote;

    public static PredictionResultResponse of(
            Long matchId,
            long homeWin,
            long draw,
            long awayWin,
            VoteOption myVote,
            boolean canVote) {
        long total = homeWin + draw + awayWin;
        double homePct  = total > 0 ? Math.round(homeWin * 1000.0 / total) / 10.0 : 0.0;
        double drawPct  = total > 0 ? Math.round(draw    * 1000.0 / total) / 10.0 : 0.0;
        double awayPct  = total > 0 ? Math.round(awayWin * 1000.0 / total) / 10.0 : 0.0;
        return PredictionResultResponse.builder()
                .matchId(matchId)
                .totalVotes(total)
                .homeWinCount(homeWin)
                .drawCount(draw)
                .awayWinCount(awayWin)
                .homeWinPercent(homePct)
                .drawPercent(drawPct)
                .awayWinPercent(awayPct)
                .myVote(myVote)
                .canVote(canVote)
                .build();
    }
}
