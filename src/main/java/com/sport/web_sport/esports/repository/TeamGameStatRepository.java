package com.sport.web_sport.esports.repository;

import com.sport.web_sport.esports.entity.TeamGameStat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamGameStatRepository extends JpaRepository<TeamGameStat, Long> {

    List<TeamGameStat> findByGameGameId(Long gameId);

    Optional<TeamGameStat> findByGameGameIdAndTeamId(Long gameId, Long teamId);
}
