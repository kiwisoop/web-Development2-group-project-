package com.team.sportsanalysis.match;

import com.team.sportsanalysis.common.SportType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchRepository matchRepo;
    private final MatchStatRepository statRepo;
    private final MatchEventRepository eventRepo;

    public MatchController(MatchRepository matchRepo, MatchStatRepository statRepo, MatchEventRepository eventRepo) {
        this.matchRepo = matchRepo;
        this.statRepo = statRepo;
        this.eventRepo = eventRepo;
    }

    @GetMapping
    public List<Match> list(@RequestParam(required = false) SportType sportType) {
        if (sportType == null) return matchRepo.findTop6ByOrderByMatchDateDesc();
        return matchRepo.findBySportTypeOrderByMatchDateDesc(sportType);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Match> get(@PathVariable Long id) {
        return matchRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/stats")
    public List<MatchStat> stats(@PathVariable Long id) {
        return statRepo.findByMatchId(id);
    }

    @GetMapping("/{id}/events")
    public List<MatchEvent> events(@PathVariable Long id) {
        return eventRepo.findByMatchIdOrderByIdAsc(id);
    }
}
