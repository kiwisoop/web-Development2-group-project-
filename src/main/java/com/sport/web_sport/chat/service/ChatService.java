package com.sport.web_sport.chat.service;

import com.sport.web_sport.chat.ChatRoomType;
import com.sport.web_sport.chat.dto.ChatMessageResponse;
import com.sport.web_sport.chat.entity.ChatMessage;
import com.sport.web_sport.chat.entity.ChatRoom;
import com.sport.web_sport.chat.repository.ChatMessageRepository;
import com.sport.web_sport.chat.repository.ChatRoomRepository;
import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatRoom getOrCreateMatchRoom(Long matchId) {
        return chatRoomRepository.findFirstByRoomTypeAndMatchIdOrderByIdAsc(ChatRoomType.MATCH, matchId)
                .orElseGet(() -> {
                    var match = matchRepository.findById(matchId)
                            .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));
                    String homeTeamName = match.getHomeTeam() != null ? match.getHomeTeam().getTeamName() : "홈팀";
                    String awayTeamName = match.getAwayTeam() != null ? match.getAwayTeam().getTeamName() : "원정팀";
                    String name = homeTeamName + " vs " + awayTeamName;
                    return chatRoomRepository.save(ChatRoom.builder()
                            .roomType(ChatRoomType.MATCH)
                            .match(match)
                            .name(name)
                            .createdAt(LocalDateTime.now())
                            .build());
                });
    }

    @Transactional
    public ChatRoom getOrCreateSportRoom(SportType sportType) {
        return chatRoomRepository.findFirstByRoomTypeAndSportTypeOrderByIdAsc(ChatRoomType.SPORT, sportType)
                .orElseGet(() -> chatRoomRepository.save(ChatRoom.builder()
                        .roomType(ChatRoomType.SPORT)
                        .sportType(sportType)
                        .name(sportType.name() + " 채팅방")
                        .createdAt(LocalDateTime.now())
                        .build()));
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long roomId) {
        return chatMessageRepository
                .findTop50ByChatRoomIdWithUser(roomId, PageRequest.of(0, 50))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse writeMessage(Long roomId, Long userId, String content) {
        if (content == null || content.isBlank()) {
            throw new BusinessException("메시지를 입력해 주세요.");
        }
        var room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException("채팅방을 찾을 수 없습니다."));
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        ChatMessage msg = chatMessageRepository.save(ChatMessage.builder()
                .chatRoom(room)
                .user(user)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build());
        return toResponse(msg);
    }

    @Transactional
    public List<ChatMessageResponse> getMatchMessages(Long matchId) {
        ChatRoom room = getOrCreateMatchRoom(matchId);
        return getMessages(room.getId());
    }

    @Transactional
    public ChatMessageResponse writeMatchMessage(Long matchId, Long userId, String content) {
        var match = matchRepository.findById(matchId)
                .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));
        MatchStatus status = match.getStatus();
        if (status == MatchStatus.SCHEDULED || status == MatchStatus.PRE_GAME) {
            throw new BusinessException("경기 시작 전에는 채팅을 작성할 수 없습니다.");
        } else if (status == MatchStatus.FINAL) {
            throw new BusinessException("경기 종료 후에는 채팅을 작성할 수 없습니다.");
        } else if (status == MatchStatus.CANCELED) {
            throw new BusinessException("취소된 경기에서는 채팅을 작성할 수 없습니다.");
        }
        ChatRoom room = getOrCreateMatchRoom(matchId);
        return writeMessage(room.getId(), userId, content);
    }

    @Transactional
    public List<ChatMessageResponse> getSportMessages(SportType sportType) {
        ChatRoom room = getOrCreateSportRoom(sportType);
        return getMessages(room.getId());
    }

    @Transactional
    public ChatMessageResponse writeSportMessage(SportType sportType, Long userId, String content) {
        ChatRoom room = getOrCreateSportRoom(sportType);
        return writeMessage(room.getId(), userId, content);
    }

    private ChatMessageResponse toResponse(ChatMessage msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId())
                .roomId(msg.getChatRoom().getId())
                .userId(msg.getUser().getId())
                .username(msg.getUser().getUsername())
                .nickname(msg.getUser().getNickname())
                .content(msg.getContent())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
