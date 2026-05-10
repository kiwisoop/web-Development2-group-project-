package com.team.sportsanalysis.mlb.records;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/mlb/records")
public class MlbRecordsController {

    private final MlbRecordsService service;

    public MlbRecordsController(MlbRecordsService service) {
        this.service = service;
    }

    private int resolveSeason(Integer season) {
        return season == null ? LocalDate.now().getYear() : season;
    }

    // GET /api/mlb/records/standings?season=YYYY
    @GetMapping("/standings")
    public List<MlbStandingTeam> standings(@RequestParam(required = false) Integer season) {
        return service.getStandings(resolveSeason(season));
    }

    // GET /api/mlb/records/leaders/hitting?season=YYYY&limit=10
    @GetMapping("/leaders/hitting")
    public List<MlbLeaderGroup> hittingLeaders(
            @RequestParam(required = false) Integer season,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        return service.getHittingLeaders(resolveSeason(season), limit);
    }

    // GET /api/mlb/records/leaders/pitching?season=YYYY&limit=10
    @GetMapping("/leaders/pitching")
    public List<MlbLeaderGroup> pitchingLeaders(
            @RequestParam(required = false) Integer season,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        return service.getPitchingLeaders(resolveSeason(season), limit);
    }

    // GET /api/mlb/records/dashboard?season=YYYY&limit=10
    @GetMapping("/dashboard")
    public MlbRecordsDashboard dashboard(
            @RequestParam(required = false) Integer season,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        return service.buildDashboard(resolveSeason(season), limit);
    }
}
