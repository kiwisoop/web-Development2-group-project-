package com.sport.web_sport.soccer.repository;

import com.sport.web_sport.soccer.entity.Standing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StandingRepository extends JpaRepository<Standing, Long> {

    @Query("""
            select s from Standing s
            where s.season = :season
            order by s.rankPosition asc
            """)
    List<Standing> findBySeason(@Param("season") String season);
}
