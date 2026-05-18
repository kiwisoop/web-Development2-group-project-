package com.sport.web_sport.chat.entity;

import com.sport.web_sport.chat.ChatRoomType;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Match;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_room")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRoomType roomType;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    @Column(nullable = false)
    private String name;

    private LocalDateTime createdAt;
}
