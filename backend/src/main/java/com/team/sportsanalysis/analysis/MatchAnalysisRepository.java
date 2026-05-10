package com.team.sportsanalysis.analysis;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MatchAnalysisRepository extends JpaRepository<MatchAnalysis, Long> {
    Optional<MatchAnalysis> findByMatchId(Long matchId);
}
