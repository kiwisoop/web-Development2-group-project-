package com.sport.web_sport.esports.repository;

import com.sport.web_sport.esports.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findByMatchIdOrderByGameNumber(Long matchId);

    @Query("select g from Game g join fetch g.blueTeam join fetch g.redTeam " +
           "left join fetch g.winnerTeam where g.match.id = :matchId order by g.gameNumber")
    List<Game> findByMatchIdWithTeams(@Param("matchId") Long matchId);

    @Query("select g from Game g join fetch g.blueTeam bt join fetch g.redTeam rt " +
           "left join fetch g.winnerTeam " +
           "join fetch g.match m " +
           "where (upper(bt.shortName) = upper(:code1) and upper(rt.shortName) = upper(:code2)) " +
           "   or (upper(bt.shortName) = upper(:code2) and upper(rt.shortName) = upper(:code1)) " +
           "order by m.matchDate desc, g.gameNumber")
    List<Game> findRecentByTeamCodes(@Param("code1") String code1, @Param("code2") String code2);
}
