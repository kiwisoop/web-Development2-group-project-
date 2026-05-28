package com.sport.web_sport.esports.init;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * LCK 2025 팀 리브랜드 반영: OKB→BRO(BRION), KDF→DNS(DN SOOPers)
 * cito API orgSlug와 DB shortName이 일치하도록 유지
 */
@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
public class Lck2026DataInitializer implements CommandLineRunner {

    private final TeamRepository teamRepo;

    @Override
    @Transactional
    public void run(String... args) {
        fixTeamRebrands();
    }

    private void fixTeamRebrands() {
        List<Team> teams = teamRepo.findBySportType(SportType.ESPORTS);
        boolean changed = false;
        for (Team t : teams) {
            if ("OKB".equals(t.getShortName())) {
                t.setShortName("BRO"); t.setTeamName("BRION");
                teamRepo.save(t); changed = true;
            } else if ("KDF".equals(t.getShortName())) {
                t.setShortName("DNS"); t.setTeamName("DN SOOPers");
                teamRepo.save(t); changed = true;
            }
        }
        if (changed) log.info("LCK 팀 리브랜드 반영 완료 (OKB→BRO, KDF→DNS)");
    }
}
