package com.sport.web_sport.soccer.repository;

import com.sport.web_sport.soccer.entity.SoccerTeam;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SoccerTeamRepository extends JpaRepository<SoccerTeam, String> {
}
