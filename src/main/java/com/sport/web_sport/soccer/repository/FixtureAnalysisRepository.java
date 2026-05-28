package com.sport.web_sport.soccer.repository;

import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.soccer.entity.FixtureAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FixtureAnalysisRepository extends JpaRepository<FixtureAnalysis, Long> {

    Optional<FixtureAnalysis> findByFixtureIdAndProvider(String fixtureId, AnalysisProvider provider);
}
