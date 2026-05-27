package com.sport.web_sport.chat.repository;

import com.sport.web_sport.chat.ChatRoomType;
import com.sport.web_sport.chat.entity.ChatRoom;
import com.sport.web_sport.common.type.SportType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findFirstByRoomTypeAndMatchIdOrderByIdAsc(ChatRoomType roomType, Long matchId);
    Optional<ChatRoom> findFirstByRoomTypeAndSportTypeOrderByIdAsc(ChatRoomType roomType, SportType sportType);
}
