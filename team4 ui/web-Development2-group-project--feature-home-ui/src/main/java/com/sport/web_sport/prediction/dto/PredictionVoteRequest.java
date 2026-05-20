package com.sport.web_sport.prediction.dto;

import com.sport.web_sport.prediction.VoteOption;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PredictionVoteRequest {
    private VoteOption voteOption;
}
