package com.sport.web_sport.sports.repository;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.League;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeagueRepository extends JpaRepository<League, Long> {
    List<League> findBySportType(SportType sportType);
    Optional<League> findBySportTypeAndLeagueName(SportType sportType, String leagueName);
    Optional<League> findByLeagueNameAndSeason(String leagueName, String season);
}
