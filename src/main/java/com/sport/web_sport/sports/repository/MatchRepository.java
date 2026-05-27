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
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findBySportType(SportType sportType);
    List<Match> findByStatus(MatchStatus status);
    List<Match> findByLeagueId(Long leagueId);
    List<Match> findByHomeTeamIdOrAwayTeamId(Long homeTeamId, Long awayTeamId);
    List<Match> findTop10ByOrderByMatchDateDesc();
    long countByStatus(MatchStatus status);
    long countBySportType(SportType sportType);
    Optional<Match> findByExternalId(String externalId);

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

    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            join fetch m.league l
            where m.sportType = :sportType
              and m.status = :status
              and l.leagueName = :leagueName
              and m.season = :season
              and (m.gameType in ('R', 'F', 'D', 'L', 'W') or m.gameType is null)
            """)
    List<Match> findBySportTypeAndStatusAndLeagueNameWithTeams(@Param("sportType") SportType sportType,
                                                               @Param("status") MatchStatus status,
                                                               @Param("leagueName") String leagueName,
                                                               @Param("season") String season);

    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            join fetch m.league
            where (:sportType is null or m.sportType = :sportType)
              and (:leagueName is null or m.league.leagueName = :leagueName)
              and m.status = :status
            order by m.matchDate desc
            """)
    List<Match> findTopByStatusDesc(@Param("sportType") SportType sportType,
                                    @Param("leagueName") String leagueName,
                                    @Param("status") MatchStatus status,
                                    Pageable pageable);

    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            join fetch m.league
            where (:sportType is null or m.sportType = :sportType)
              and (:leagueName is null or m.league.leagueName = :leagueName)
              and m.status = :status
            order by m.matchDate asc
            """)
    List<Match> findTopByStatusAsc(@Param("sportType") SportType sportType,
                                   @Param("leagueName") String leagueName,
                                   @Param("status") MatchStatus status,
                                   Pageable pageable);

    /** 추천팀: 해당 팀의 다음 예정(SCHEDULED) 경기를 이른 순으로. PageRequest.of(0,1) 로 1건 사용. */
    @Query("""
            select m from Match m
            join fetch m.homeTeam ht
            join fetch m.awayTeam at
            where (ht.id = :teamId or at.id = :teamId)
              and m.status = com.sport.web_sport.common.type.MatchStatus.SCHEDULED
              and m.matchDate >= :now
            order by m.matchDate asc
            """)
    List<Match> findUpcomingByTeamId(@Param("teamId") Long teamId,
                                     @Param("now") LocalDateTime now,
                                     Pageable pageable);

    /** 추천팀: 해당 팀의 최근 종료(FINAL) 경기를 최신순으로. 최근 폼 계산에 사용. */
    @Query("""
            select m from Match m
            join fetch m.homeTeam ht
            join fetch m.awayTeam at
            where (ht.id = :teamId or at.id = :teamId)
              and m.status = com.sport.web_sport.common.type.MatchStatus.FINAL
            order by m.matchDate desc
            """)
    List<Match> findRecentFinishedByTeamId(@Param("teamId") Long teamId, Pageable pageable);
}
