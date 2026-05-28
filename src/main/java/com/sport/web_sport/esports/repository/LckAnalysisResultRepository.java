package com.sport.web_sport.esports.repository;

import com.sport.web_sport.esports.entity.LckAnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LckAnalysisResultRepository extends JpaRepository<LckAnalysisResult, Long> {

    Optional<LckAnalysisResult> findByGameGameId(Long gameId);
}
