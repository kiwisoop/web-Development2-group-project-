package com.sport.web_sport.esports.repository;

import com.sport.web_sport.esports.entity.PlayerGameStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlayerGameStatRepository extends JpaRepository<PlayerGameStat, Long> {

    List<PlayerGameStat> findByGameGameId(Long gameId);

    List<PlayerGameStat> findByPlayerIdOrderByGameGameId(Long playerId);

    /** 선수 시즌별 통계 집계 (KDA, CS, 골드, DPM, 시야점수 등) */
    @Query("""
        select pgs from PlayerGameStat pgs
        join fetch pgs.game g
        join fetch pgs.player p
        where p.id = :playerId
          and g.match.season = :season
        order by g.gameId
        """)
    List<PlayerGameStat> findByPlayerAndSeason(@Param("playerId") Long playerId,
                                               @Param("season") String season);

    /** 선수의 모든 경기 통계 (경기/매치 fetch join) — 시즌 요약 및 경기별 상세 양쪽에서 사용 */
    @Query("""
        select pgs from PlayerGameStat pgs
        join fetch pgs.game g
        join fetch g.match m
        left join fetch m.homeTeam
        left join fetch m.awayTeam
        join fetch pgs.player p
        join fetch p.team
        where p.id = :playerId
        order by m.matchDate desc, g.gameNumber
        """)
    List<PlayerGameStat> findAllByPlayerWithGame(@Param("playerId") Long playerId);
}
