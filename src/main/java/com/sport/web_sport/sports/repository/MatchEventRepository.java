package com.sport.web_sport.sports.repository;

import com.sport.web_sport.sports.entity.MatchEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchEventRepository extends JpaRepository<MatchEvent, Long> {
    List<MatchEvent> findByMatchIdOrderByEventTimeAsc(Long matchId);
}
