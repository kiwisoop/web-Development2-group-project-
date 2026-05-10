package com.team.sportsanalysis.favorite;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FavoriteTeamRepository extends JpaRepository<FavoriteTeam, Long> {
    List<FavoriteTeam> findByUserId(Long userId);
    boolean existsByUserIdAndTeamName(Long userId, String teamName);
}
