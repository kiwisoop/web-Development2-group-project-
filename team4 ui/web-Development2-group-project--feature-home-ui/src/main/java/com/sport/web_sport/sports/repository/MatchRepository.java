package com.sport.web_sport.sports.repository;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Match;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findBySportType(SportType sportType);
    List<Match> findByStatus(MatchStatus status);
    List<Match> findByLeagueId(Long leagueId);
    List<Match> findByHomeTeamIdOrAwayTeamId(Long homeTeamId, Long awayTeamId);
    List<Match> findTop10ByOrderByMatchDateDesc();
    long countByStatus(MatchStatus status);
    long countBySportType(SportType sportType);

    @Query("select m from Match m join fetch m.homeTeam join fetch m.awayTeam order by m.matchDate desc")
    List<Match> findTop10WithTeams(Pageable pageable);

    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            join fetch m.league
            where m.id = :id
            """)
    java.util.Optional<Match> findByIdWithTeams(@Param("id") Long id);

    @Query("""
            select m from Match m
            join fetch m.homeTeam ht
            join fetch m.awayTeam at
            join fetch m.league l
            where (:sportType is null or m.sportType = :sportType)
              and (:status is null or m.status = :status)
              and (:leagueId is null or l.id = :leagueId)
              and (:teamId is null or ht.id = :teamId or at.id = :teamId)
              and (:start is null or m.matchDate >= :start)
              and (:end is null or m.matchDate < :end)
              and (:keyword is null or :keyword = ''
                   or lower(ht.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(at.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(l.leagueName)  like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(m.venue, '')) like lower(concat('%', :keyword, '%')))
            order by m.matchDate desc
            """)
    List<Match> searchMatches(@Param("sportType") SportType sportType,
                              @Param("status") MatchStatus status,
                              @Param("leagueId") Long leagueId,
                              @Param("teamId") Long teamId,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end,
                              @Param("keyword") String keyword);

    @Query("""
            select m from Match m
            join fetch m.homeTeam ht
            join fetch m.awayTeam at
            join fetch m.league l
            where (:sportType is null or m.sportType = :sportType)
              and (:status is null or m.status = :status)
              and (:leagueId is null or l.id = :leagueId)
              and (:teamId is null or ht.id = :teamId or at.id = :teamId)
              and (:start is null or m.matchDate >= :start)
              and (:end is null or m.matchDate < :end)
              and (:keyword is null or :keyword = ''
                   or lower(ht.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(at.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(l.leagueName)  like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(m.venue, '')) like lower(concat('%', :keyword, '%')))
            """)
    Page<Match> searchMatchesPaged(@Param("sportType") SportType sportType,
                                   @Param("status") MatchStatus status,
                                   @Param("leagueId") Long leagueId,
                                   @Param("teamId") Long teamId,
                                   @Param("start") LocalDateTime start,
                                   @Param("end") LocalDateTime end,
                                   @Param("keyword") String keyword,
                                   Pageable pageable);

    @Query("""
            select m from Match m
            join fetch m.homeTeam ht
            join fetch m.awayTeam at
            join fetch m.league l
            where (:sportType is null or m.sportType = :sportType)
              and (:status is null or m.status = :status)
              and (:leagueId is null or l.id = :leagueId)
              and (:teamId is null or ht.id = :teamId or at.id = :teamId)
              and (:start is null or m.matchDate >= :start)
              and (:end is null or m.matchDate < :end)
              and (:keyword is null or :keyword = ''
                   or lower(ht.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(at.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(l.leagueName)  like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(m.venue, '')) like lower(concat('%', :keyword, '%')))
            order by case when m.status = com.sport.web_sport.common.type.MatchStatus.LIVE then 0 else 1 end,
                     m.matchDate desc
            """)
    Page<Match> searchMatchesLiveFirst(@Param("sportType") SportType sportType,
                                       @Param("status") MatchStatus status,
                                       @Param("leagueId") Long leagueId,
                                       @Param("teamId") Long teamId,
                                       @Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end,
                                       @Param("keyword") String keyword,
                                       Pageable pageable);

    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            join fetch m.league
            where (m.homeTeam.id in :teamIds or m.awayTeam.id in :teamIds)
            order by m.matchDate desc
            """)
    List<Match> findMatchesByTeamIds(@Param("teamIds") List<Long> teamIds, Pageable pageable);

    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            left join fetch m.league
            where m.sportType = :sportType
              and m.status = :status
            """)
    List<Match> findBySportTypeAndStatusWithTeams(@Param("sportType") SportType sportType,
                                                  @Param("status") MatchStatus status);
}
