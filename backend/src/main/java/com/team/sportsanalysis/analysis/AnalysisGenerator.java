package com.team.sportsanalysis.analysis;

import com.team.sportsanalysis.match.Match;
import com.team.sportsanalysis.match.MatchEvent;
import com.team.sportsanalysis.match.MatchStat;
import java.util.List;

// Strategy interface so a real LLM impl can replace the mock later.
public interface AnalysisGenerator {
    MatchAnalysis generate(Match match, List<MatchStat> stats, List<MatchEvent> events);
}
