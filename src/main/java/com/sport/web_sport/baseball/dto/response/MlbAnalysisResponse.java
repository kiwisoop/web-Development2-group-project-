package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MlbAnalysisResponse {

    private WinProbability winProbability;
    private PitcherSummary homePitcher;
    private PitcherSummary awayPitcher;
    private List<KeyBatter> keyBatters;
    private List<InningScore> inningFlow;
    private String summary;
    private String tactical;
    private String keyPoint;

    @Getter
    @Builder
    public static class WinProbability {
        private int home;
        private int away;
    }

    @Getter
    @Builder
    public static class PitcherSummary {
        private String name;
        private int strikeOuts;
        private int baseOnBalls;
        private int numberOfPitches;
        private String era;
    }

    @Getter
    @Builder
    public static class KeyBatter {
        private String team;
        private String name;
        private String hits;
        private String homeRuns;
        private String rbi;
    }

    @Getter
    @Builder
    public static class InningScore {
        private int inning;
        private String home;
        private String away;
    }
}
