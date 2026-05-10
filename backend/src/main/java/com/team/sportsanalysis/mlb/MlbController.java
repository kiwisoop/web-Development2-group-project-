package com.team.sportsanalysis.mlb;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/mlb")
public class MlbController {

    private final MlbService service;

    public MlbController(MlbService service) {
        this.service = service;
    }

    // GET /api/mlb/schedule?date=YYYY-MM-DD  (date defaults to today)
    @GetMapping("/schedule")
    public List<MlbGame> schedule(@RequestParam(required = false) String date) {
        String d = (date == null || date.isBlank()) ? LocalDate.now().toString() : date;
        return service.getSchedule(d);
    }

    // GET /api/mlb/game/{gamePk}
    @GetMapping("/game/{gamePk}")
    public MlbGameDetail gameDetail(@PathVariable long gamePk) {
        return service.getGameDetail(gamePk);
    }
}
