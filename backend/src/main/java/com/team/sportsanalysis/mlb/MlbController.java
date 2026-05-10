package com.team.sportsanalysis.mlb;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mlb")
public class MlbController {

    private final MlbService service;
    private final BaseballSummaryService summaryService;

    public MlbController(MlbService service, BaseballSummaryService summaryService) {
        this.service = service;
        this.summaryService = summaryService;
    }

    // GET /api/mlb/schedule?date=YYYY-MM-DD  (date defaults to today)
    @GetMapping("/schedule")
    public List<MlbGame> schedule(@RequestParam(required = false) String date) {
        String d = (date == null || date.isBlank()) ? LocalDate.now().toString() : date;
        return service.getSchedule(d);
    }

    // GET /api/mlb/schedule/month?year=YYYY&month=MM
    @GetMapping("/schedule/month")
    public List<MlbGame> monthSchedule(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        LocalDate now = LocalDate.now();
        int y = (year == null) ? now.getYear() : year;
        int m = (month == null) ? now.getMonthValue() : month;
        if (m < 1 || m > 12) {
            throw new IllegalArgumentException("month must be between 1 and 12");
        }
        return service.getMonthSchedule(y, m);
    }

    // GET /api/mlb/game/{gamePk}
    @GetMapping("/game/{gamePk}")
    public MlbGameDetail gameDetail(@PathVariable long gamePk) {
        return service.getGameDetail(gamePk);
    }

    // GET /api/mlb/game/{gamePk}/summary/mock
    @GetMapping("/game/{gamePk}/summary/mock")
    public BaseballSummaryResponse mockSummary(@PathVariable long gamePk) {
        return summaryService.buildMockSummary(gamePk);
    }

    // GET /api/mlb/game/{gamePk}/summary/gemini
    @GetMapping("/game/{gamePk}/summary/gemini")
    public BaseballSummaryResponse geminiSummary(@PathVariable long gamePk) {
        return summaryService.buildGeminiSummary(gamePk);
    }

    // GET /api/mlb/game/{gamePk}/summary/compare
    @GetMapping("/game/{gamePk}/summary/compare")
    public Map<String, BaseballSummaryResponse> compareSummary(@PathVariable long gamePk) {
        return summaryService.buildCompare(gamePk);
    }
}
