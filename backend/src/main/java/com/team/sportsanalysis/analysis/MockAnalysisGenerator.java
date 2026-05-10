package com.team.sportsanalysis.analysis;

import com.team.sportsanalysis.match.Match;
import com.team.sportsanalysis.match.MatchEvent;
import com.team.sportsanalysis.match.MatchStat;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

// Mock natural-language summary built from match info, stats, events.
// No real LLM call; replace later by adding another @Component AnalysisGenerator
// (and marking this @Primary off).
@Component
public class MockAnalysisGenerator implements AnalysisGenerator {

    @Override
    public MatchAnalysis generate(Match m, List<MatchStat> stats, List<MatchEvent> events) {
        String winnerLine;
        if (m.getHomeScore() == null || m.getAwayScore() == null) {
            winnerLine = m.getHomeTeam() + " vs " + m.getAwayTeam() + " has not started yet.";
        } else if (m.getHomeScore() > m.getAwayScore()) {
            winnerLine = m.getHomeTeam() + " defeated " + m.getAwayTeam()
                    + " " + m.getHomeScore() + "-" + m.getAwayScore() + ".";
        } else if (m.getHomeScore() < m.getAwayScore()) {
            winnerLine = m.getAwayTeam() + " defeated " + m.getHomeTeam()
                    + " " + m.getAwayScore() + "-" + m.getHomeScore() + " on the road.";
        } else {
            winnerLine = m.getHomeTeam() + " and " + m.getAwayTeam()
                    + " drew " + m.getHomeScore() + "-" + m.getAwayScore() + ".";
        }

        String eventLine = events.isEmpty()
                ? "No notable events recorded."
                : events.stream()
                    .limit(5)
                    .map(e -> e.getEventTime() + " " + e.getEventType() + " - "
                            + (e.getPlayerName() == null ? e.getTeamName() : e.getPlayerName()))
                    .collect(Collectors.joining("; "));

        String statLine = stats.isEmpty()
                ? "Stats not available."
                : "Key stats: " + stats.stream()
                    .limit(6)
                    .map(s -> s.getTeamName() + " " + s.getStatName() + "=" + s.getStatValue())
                    .collect(Collectors.joining(", "));

        String summary = winnerLine + " " + statLine + " " + eventLine;

        String tactical = "Tactical read: based on the recorded stats, "
                + (m.getHomeTeam()) + " controlled key phases at home"
                + (events.isEmpty() ? "." : ", with momentum shifts visible in the timeline.");

        String keyPoint = events.isEmpty()
                ? "Decisive moment: not enough event data."
                : "Decisive moment around " + events.get(0).getEventTime()
                    + " (" + events.get(0).getEventType() + ").";

        return MatchAnalysis.builder()
                .matchId(m.getId())
                .summaryText(summary)
                .tacticalAnalysis(tactical)
                .keyPoint(keyPoint)
                .build();
    }
}
