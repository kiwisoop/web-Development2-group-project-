package com.sport.web_sport.sports.repository;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findBySportType(SportType sportType);
    List<Team> findByLeagueId(Long leagueId);

    @Query("select t from Team t join fetch t.league where t.sportType = :sportType order by t.teamName")
    List<Team> findBySportTypeWithLeague(@Param("sportType") SportType sportType);

    java.util.Optional<Team> findByTeamNameAndSportType(String teamName, SportType sportType);
}
