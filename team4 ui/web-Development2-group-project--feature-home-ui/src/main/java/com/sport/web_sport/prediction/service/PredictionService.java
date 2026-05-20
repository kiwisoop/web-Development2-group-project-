package com.sport.web_sport.prediction.service;

import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.prediction.VoteOption;
import com.sport.web_sport.prediction.dto.PredictionResultResponse;
import com.sport.web_sport.prediction.entity.PredictionVote;
import com.sport.web_sport.prediction.repository.PredictionVoteRepository;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.user.entity.User;
import com.sport.web_sport.user.repository.UserRepository;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PredictionService {

    private final PredictionVoteRepository predictionVoteRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public PredictionResultResponse getPredictionResult(Long matchId, HttpSession session) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));

        long homeWin = predictionVoteRepository.countByMatchIdAndVoteOption(matchId, VoteOption.HOME_WIN);
        long draw    = predictionVoteRepository.countByMatchIdAndVoteOption(matchId, VoteOption.DRAW);
        long awayWin = predictionVoteRepository.countByMatchIdAndVoteOption(matchId, VoteOption.AWAY_WIN);

        Long userId = authService.getLoginUserId(session);
        VoteOption myVote = null;
        if (userId != null) {
            myVote = predictionVoteRepository.findByMatchIdAndUserId(matchId, userId)
                    .map(PredictionVote::getVoteOption)
                    .orElse(null);
        }

        boolean canVote = isVotableStatus(match);
        return PredictionResultResponse.of(matchId, homeWin, draw, awayWin, myVote, canVote);
    }

    @Transactional
    public PredictionResultResponse vote(Long matchId, VoteOption voteOption, HttpSession session) {
        Long userId = authService.requireLoginUserId(session);

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));

        if (!isVotableStatus(match)) {
            throw new BusinessException("종료된 경기에는 투표할 수 없습니다.");
        }

        Optional<PredictionVote> existing = predictionVoteRepository.findByMatchIdAndUserId(matchId, userId);
        if (existing.isPresent()) {
            existing.get().setVoteOption(voteOption);
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
            predictionVoteRepository.save(PredictionVote.builder()
                    .match(match)
                    .user(user)
                    .voteOption(voteOption)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        long homeWin = predictionVoteRepository.countByMatchIdAndVoteOption(matchId, VoteOption.HOME_WIN);
        long draw    = predictionVoteRepository.countByMatchIdAndVoteOption(matchId, VoteOption.DRAW);
        long awayWin = predictionVoteRepository.countByMatchIdAndVoteOption(matchId, VoteOption.AWAY_WIN);
        return PredictionResultResponse.of(matchId, homeWin, draw, awayWin, voteOption, true);
    }

    private boolean isVotableStatus(Match match) {
        String s = match.getStatus().name();
        return !"FINAL".equals(s) && !"CANCELLED".equals(s);
    }
}
