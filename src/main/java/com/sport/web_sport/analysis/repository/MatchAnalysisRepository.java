package com.sport.web_sport.analysis.repository;

import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MatchAnalysisRepository extends JpaRepository<MatchAnalysis, Long> {
    Optional<MatchAnalysis> findByMatchIdAndProvider(Long matchId, AnalysisProvider provider);
    long countByStatus(AnalysisStatus status);

    /** 추천팀: 특정 경기의 가장 최근 분석 1건 (provider 무관). */
    Optional<MatchAnalysis> findFirstByMatchIdOrderByIdDesc(Long matchId);
}
