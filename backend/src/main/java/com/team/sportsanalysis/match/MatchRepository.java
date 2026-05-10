package com.team.sportsanalysis.match;

import com.team.sportsanalysis.common.SportType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findBySportTypeOrderByMatchDateDesc(SportType sportType);
    List<Match> findTop6ByOrderByMatchDateDesc();
}
