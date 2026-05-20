package com.sport.web_sport.prediction.entity;

import com.sport.web_sport.prediction.VoteOption;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "prediction_vote",
    uniqueConstraints = @UniqueConstraint(columnNames = {"match_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VoteOption voteOption;

    private LocalDateTime createdAt;
}
