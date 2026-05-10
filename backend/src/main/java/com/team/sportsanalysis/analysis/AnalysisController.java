package com.team.sportsanalysis.analysis;

import com.team.sportsanalysis.match.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches/{id}/analysis")
public class AnalysisController {

    private final MatchRepository matchRepo;
    private final MatchStatRepository statRepo;
    private final MatchEventRepository eventRepo;
    private final MatchAnalysisRepository analysisRepo;
    private final AnalysisGenerator generator;

    public AnalysisController(MatchRepository matchRepo, MatchStatRepository statRepo,
                              MatchEventRepository eventRepo, MatchAnalysisRepository analysisRepo,
                              AnalysisGenerator generator) {
        this.matchRepo = matchRepo;
        this.statRepo = statRepo;
        this.eventRepo = eventRepo;
        this.analysisRepo = analysisRepo;
        this.generator = generator;
    }

    @GetMapping
    public ResponseEntity<MatchAnalysis> get(@PathVariable Long id) {
        return analysisRepo.findByMatchId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // POST regenerates (or creates) the mock AI summary for the given match.
    @PostMapping
    public ResponseEntity<MatchAnalysis> generate(@PathVariable Long id) {
        Match match = matchRepo.findById(id).orElse(null);
        if (match == null) return ResponseEntity.notFound().build();

        List<MatchStat> stats = statRepo.findByMatchId(id);
        List<MatchEvent> events = eventRepo.findByMatchIdOrderByIdAsc(id);

        MatchAnalysis fresh = generator.generate(match, stats, events);

        MatchAnalysis saved = analysisRepo.findByMatchId(id)
                .map(existing -> {
                    existing.setSummaryText(fresh.getSummaryText());
                    existing.setTacticalAnalysis(fresh.getTacticalAnalysis());
                    existing.setKeyPoint(fresh.getKeyPoint());
                    return analysisRepo.save(existing);
                })
                .orElseGet(() -> analysisRepo.save(fresh));

        return ResponseEntity.ok(saved);
    }
}
