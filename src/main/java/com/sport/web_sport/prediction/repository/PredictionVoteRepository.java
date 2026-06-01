package com.sport.web_sport.prediction.repository;

import com.sport.web_sport.prediction.VoteOption;
import com.sport.web_sport.prediction.entity.PredictionVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PredictionVoteRepository extends JpaRepository<PredictionVote, Long> {
    Optional<PredictionVote> findByMatchIdAndUserId(Long matchId, Long userId);
    long deleteByUserId(Long userId);
    boolean existsByMatchIdAndUserId(Long matchId, Long userId);
    long countByMatchIdAndVoteOption(Long matchId, VoteOption voteOption);
    long countByMatchId(Long matchId);
}
