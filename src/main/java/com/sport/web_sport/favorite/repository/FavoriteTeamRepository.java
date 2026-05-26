package com.sport.web_sport.favorite.repository;

import com.sport.web_sport.favorite.entity.FavoriteTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FavoriteTeamRepository extends JpaRepository<FavoriteTeam, Long> {
    List<FavoriteTeam> findByUserId(Long userId);
    boolean existsByUserIdAndTeamId(Long userId, Long teamId);

    @Query("""
            select f from FavoriteTeam f
            join fetch f.team t
            join fetch t.league l
            where f.user.id = :userId
            order by f.createdAt desc
            """)
    List<FavoriteTeam> findByUserIdWithTeamAndLeague(@Param("userId") Long userId);

    @Query("select f.team.id from FavoriteTeam f where f.user.id = :userId")
    List<Long> findTeamIdsByUserId(@Param("userId") Long userId);
}
