package com.sport.web_sport.soccer.service;

import com.sport.web_sport.soccer.dto.response.StandingResponse;
import com.sport.web_sport.soccer.entity.Standing;
import com.sport.web_sport.soccer.repository.StandingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StandingService {

    private static final String K_LEAGUE_1 = "K League 1";

    private final StandingRepository standingRepository;

    public List<StandingResponse> getStandings(String season) {
        List<Standing> rows = standingRepository.findBySeason(season);
        return rows.stream()
                .map(s -> StandingResponse.from(s, K_LEAGUE_1))
                .toList();
    }
}
