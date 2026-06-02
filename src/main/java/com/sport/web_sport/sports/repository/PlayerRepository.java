package com.sport.web_sport.sports.repository;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByTeamId(Long teamId);
    List<Player> findBySportType(SportType sportType);
    List<Player> findByTeamSportTypeAndTeamShortNameIgnoreCase(SportType sportType, String shortName);
}
