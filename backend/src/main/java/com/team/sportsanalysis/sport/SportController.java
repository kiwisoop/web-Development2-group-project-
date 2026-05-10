package com.team.sportsanalysis.sport;

import com.team.sportsanalysis.common.SportType;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/sports")
public class SportController {

    @GetMapping
    public List<SportType> list() {
        return Arrays.asList(SportType.values());
    }
}
