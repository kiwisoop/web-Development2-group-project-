package com.team.sportsanalysis.match;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MatchStatRepository extends JpaRepository<MatchStat, Long> {
    List<MatchStat> findByMatchId(Long matchId);
}
