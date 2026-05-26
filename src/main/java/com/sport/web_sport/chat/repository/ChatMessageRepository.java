package com.sport.web_sport.chat.repository;

import com.sport.web_sport.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("select m from ChatMessage m join fetch m.user where m.chatRoom.id = :roomId order by m.createdAt asc")
    List<ChatMessage> findTop50ByChatRoomIdWithUser(@Param("roomId") Long roomId, Pageable pageable);
}
