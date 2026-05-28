package com.sport.web_sport.soccer.repository;

import com.sport.web_sport.soccer.entity.Fixture;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FixtureRepository extends JpaRepository<Fixture, String> {

    @Query("""
            select f from Fixture f
            left join fetch f.homeTeam
            left join fetch f.awayTeam
            where f.fixtureId = :id
            """)
    Optional<Fixture> findByIdWithTeams(@Param("id") String id);

    @Query("""
            select f from Fixture f
            left join fetch f.homeTeam ht
            left join fetch f.awayTeam at
            where (:season is null or f.season = :season)
              and (:status is null or f.status = :status)
              and (:teamId is null or f.homeTeamId = :teamId or f.awayTeamId = :teamId)
              and (:keyword is null or :keyword = ''
                   or lower(f.homeTeamName) like lower(concat('%', :keyword, '%'))
                   or lower(f.awayTeamName) like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(f.venue, '')) like lower(concat('%', :keyword, '%')))
            """)
    Page<Fixture> search(@Param("season") String season,
                         @Param("status") String status,
                         @Param("teamId") String teamId,
                         @Param("keyword") String keyword,
                         Pageable pageable);

    /**
     * 특정 시즌 내 특정 팀의 종료된(FT) 경기 중 가장 최근 N개를 반환.
     * 분석 대상 경기 자체는 :excludeId로 제외 가능.
     */
    @Query("""
            select f from Fixture f
            where f.season = :season
              and f.status = 'FT'
              and f.fixtureId <> :excludeId
              and (f.homeTeamId = :teamId or f.awayTeamId = :teamId)
            order by f.matchDate desc
            """)
    List<Fixture> findRecentFinishedByTeam(@Param("season") String season,
                                           @Param("teamId") String teamId,
                                           @Param("excludeId") String excludeId,
                                           Pageable pageable);
}
