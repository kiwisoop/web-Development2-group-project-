package com.sport.web_sport.sports.repository;

import com.sport.web_sport.sports.entity.MatchStat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchStatRepository extends JpaRepository<MatchStat, Long> {
    List<MatchStat> findByMatchId(Long matchId);
}
