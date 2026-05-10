package com.team.sportsanalysis.match;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MatchEventRepository extends JpaRepository<MatchEvent, Long> {
    List<MatchEvent> findByMatchIdOrderByIdAsc(Long matchId);
}
