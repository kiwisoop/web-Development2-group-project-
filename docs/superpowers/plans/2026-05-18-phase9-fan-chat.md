# Fan Chat Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a REST + DB based fan chat feature: match-specific chat on MatchDetailPage, and sport-specific chat on a new ChatRoomPage.

**Architecture:** New `com.sport.web_sport.chat` backend package with `ChatRoom`/`ChatMessage` entities, a service that lazily creates rooms on first access, and four REST endpoints. Frontend replaces the existing `ChatPreview` placeholder with a real `ChatBox` component used on both MatchDetailPage and ChatRoomPage. No WebSocket — polling/manual refresh only.

**Tech Stack:** Spring Boot 3, Jakarta Persistence, Lombok, Spring Data JPA; React 18, plain CSS, axios, `useCallback` for stable fetch refs

---

### Task 1: Chat entities + repositories + compile

**Files:**
- Create: `src/main/java/com/sport/web_sport/chat/ChatRoomType.java`
- Create: `src/main/java/com/sport/web_sport/chat/entity/ChatRoom.java`
- Create: `src/main/java/com/sport/web_sport/chat/entity/ChatMessage.java`
- Create: `src/main/java/com/sport/web_sport/chat/repository/ChatRoomRepository.java`
- Create: `src/main/java/com/sport/web_sport/chat/repository/ChatMessageRepository.java`

- [ ] **Step 1: Create ChatRoomType enum**

```java
package com.sport.web_sport.chat;

public enum ChatRoomType {
    MATCH, SPORT
}
```

- [ ] **Step 2: Create ChatRoom entity**

```java
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
```

- [ ] **Step 3: Create ChatMessage entity**

```java
package com.sport.web_sport.chat.entity;

import com.sport.web_sport.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String content;

    private LocalDateTime createdAt;
}
```

- [ ] **Step 4: Create ChatRoomRepository**

```java
package com.sport.web_sport.chat.repository;

import com.sport.web_sport.chat.ChatRoomType;
import com.sport.web_sport.chat.entity.ChatRoom;
import com.sport.web_sport.common.type.SportType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByRoomTypeAndMatchId(ChatRoomType roomType, Long matchId);
    Optional<ChatRoom> findByRoomTypeAndSportType(ChatRoomType roomType, SportType sportType);
}
```

- [ ] **Step 5: Create ChatMessageRepository**

`join fetch m.user` is required — `user` is a lazy association and is accessed during DTO mapping outside a Hibernate session.

```java
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
```

- [ ] **Step 6: Compile**

Run: `.\mvnw.cmd compile`

Expected: `BUILD SUCCESS`

---

### Task 2: Chat DTOs

**Files:**
- Create: `src/main/java/com/sport/web_sport/chat/dto/ChatRoomResponse.java`
- Create: `src/main/java/com/sport/web_sport/chat/dto/ChatMessageResponse.java`
- Create: `src/main/java/com/sport/web_sport/chat/dto/ChatMessageRequest.java`

- [ ] **Step 1: Create ChatRoomResponse**

```java
package com.sport.web_sport.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatRoomResponse {
    private Long roomId;
    private String roomType;
    private String sportType;
    private Long matchId;
    private String name;
}
```

- [ ] **Step 2: Create ChatMessageResponse**

```java
package com.sport.web_sport.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long roomId;
    private Long userId;
    private String username;
    private String nickname;
    private String content;
    private LocalDateTime createdAt;
}
```

- [ ] **Step 3: Create ChatMessageRequest**

```java
package com.sport.web_sport.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChatMessageRequest {
    private String content;
}
```

---

### Task 3: ChatService + ChatController + compile

**Files:**
- Create: `src/main/java/com/sport/web_sport/chat/service/ChatService.java`
- Create: `src/main/java/com/sport/web_sport/chat/controller/ChatController.java`

- [ ] **Step 1: Create ChatService**

`getOrCreateMatchRoom` accesses `match.getHomeTeam().getTeamName()` — lazy load is safe because the method is `@Transactional`. Rooms are created on first access; subsequent calls return the existing room.

```java
package com.sport.web_sport.chat.service;

import com.sport.web_sport.chat.ChatRoomType;
import com.sport.web_sport.chat.dto.ChatMessageResponse;
import com.sport.web_sport.chat.entity.ChatMessage;
import com.sport.web_sport.chat.entity.ChatRoom;
import com.sport.web_sport.chat.repository.ChatMessageRepository;
import com.sport.web_sport.chat.repository.ChatRoomRepository;
import com.sport.web_sport.common.error.BusinessException;
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
        return chatRoomRepository.findByRoomTypeAndMatchId(ChatRoomType.MATCH, matchId)
                .orElseGet(() -> {
                    var match = matchRepository.findById(matchId)
                            .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));
                    String name = match.getHomeTeam().getTeamName()
                            + " vs " + match.getAwayTeam().getTeamName();
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
        return chatRoomRepository.findByRoomTypeAndSportType(ChatRoomType.SPORT, sportType)
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
```

- [ ] **Step 2: Create ChatController**

```java
package com.sport.web_sport.chat.controller;

import com.sport.web_sport.chat.dto.ChatMessageRequest;
import com.sport.web_sport.chat.dto.ChatMessageResponse;
import com.sport.web_sport.chat.service.ChatService;
import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AuthService authService;

    @GetMapping("/api/matches/{matchId}/chat")
    public ApiResponse<List<ChatMessageResponse>> getMatchChat(@PathVariable Long matchId) {
        return ApiResponse.ok(chatService.getMatchMessages(matchId));
    }

    @PostMapping("/api/matches/{matchId}/chat")
    public ApiResponse<ChatMessageResponse> sendMatchChat(
            @PathVariable Long matchId,
            @RequestBody ChatMessageRequest request,
            HttpSession session) {
        Long userId = authService.requireLoginUserId(session);
        return ApiResponse.ok(chatService.writeMatchMessage(matchId, userId, request.getContent()));
    }

    @GetMapping("/api/chat/sports/{sportType}")
    public ApiResponse<List<ChatMessageResponse>> getSportChat(@PathVariable SportType sportType) {
        return ApiResponse.ok(chatService.getSportMessages(sportType));
    }

    @PostMapping("/api/chat/sports/{sportType}")
    public ApiResponse<ChatMessageResponse> sendSportChat(
            @PathVariable SportType sportType,
            @RequestBody ChatMessageRequest request,
            HttpSession session) {
        Long userId = authService.requireLoginUserId(session);
        return ApiResponse.ok(chatService.writeSportMessage(sportType, userId, request.getContent()));
    }
}
```

- [ ] **Step 3: Compile**

Run: `.\mvnw.cmd compile`

Expected: `BUILD SUCCESS`

---

### Task 4: Frontend chatApi.js + ChatBox.jsx

**Files:**
- Create: `frontend/src/api/chatApi.js`
- Create: `frontend/src/components/ChatBox.jsx`

- [ ] **Step 1: Create chatApi.js**

```js
import axiosInstance from './axiosInstance';

export const getMatchChatMessages = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/chat`, { signal });

export const sendMatchChatMessage = (matchId, content) =>
  axiosInstance.post(`/matches/${matchId}/chat`, { content });

export const getSportChatMessages = (sportType, signal) =>
  axiosInstance.get(`/chat/sports/${sportType}`, { signal });

export const sendSportChatMessage = (sportType, content) =>
  axiosInstance.post(`/chat/sports/${sportType}`, { content });
```

- [ ] **Step 2: Create ChatBox.jsx**

Props: `{ mode, matchId, sportType, isLoggedIn }`
- `mode`: `'match'` or `'sport'`
- `matchId`: Long (used when `mode === 'match'`)
- `sportType`: string like `'SOCCER'` (used when `mode === 'sport'`)
- `isLoggedIn`: boolean

`useCallback` stabilises `loadMessages` so the `useEffect` dependency array is clean.

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getMatchChatMessages, sendMatchChatMessage,
  getSportChatMessages, sendSportChatMessage,
} from '../api/chatApi';

export default function ChatBox({ mode, matchId, sportType, isLoggedIn }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const bottomRef = useRef(null);

  const loadMessages = useCallback((signal) => {
    setLoading(true);
    const req = mode === 'match'
      ? getMatchChatMessages(matchId, signal)
      : getSportChatMessages(sportType, signal);
    req
      .then(res => setMessages(res.data.data))
      .catch(err => {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
          setMessages([]);
        }
      })
      .finally(() => setLoading(false));
  }, [mode, matchId, sportType]);

  useEffect(() => {
    const controller = new AbortController();
    setMessages([]);
    loadMessages(controller.signal);
    return () => controller.abort();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const res = mode === 'match'
        ? await sendMatchChatMessage(matchId, trimmed)
        : await sendSportChatMessage(sportType, trimmed);
      setMessages(prev => [...prev, res.data.data]);
      setContent('');
    } catch {
      // silently ignore — server errors are non-critical
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <span>채팅</span>
        <button className="btn btn-outline chat-refresh-btn" onClick={() => loadMessages()}>
          새로고침
        </button>
      </div>

      <div className="chat-message-list">
        {loading && <p className="chat-notice">로딩 중...</p>}
        {!loading && messages.length === 0 && (
          <p className="chat-notice">아직 메시지가 없습니다.</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="chat-message">
            <span className="chat-author">{msg.nickname || msg.username}</span>
            <span className="chat-content">{msg.content}</span>
            <span className="chat-time">
              {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!isLoggedIn ? (
        <p className="chat-notice chat-login-notice">
          로그인 후 채팅에 참여할 수 있습니다.
        </p>
      ) : (
        <div className="chat-input-row">
          <input
            className="chat-input"
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            disabled={sending}
            maxLength={500}
          />
          <button
            className="btn btn-primary chat-send-btn"
            onClick={handleSend}
            disabled={sending || !content.trim()}
          >
            전송
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Task 5: MatchDetailPage + ChatRoomPage + AppRouter + Header

**Files:**
- Modify: `frontend/src/pages/MatchDetailPage.jsx`
- Create: `frontend/src/pages/ChatRoomPage.jsx`
- Modify: `frontend/src/router/AppRouter.jsx`
- Modify: `frontend/src/components/Header.jsx`

- [ ] **Step 1: Update MatchDetailPage.jsx**

Replace the `ChatPreview` import and usage.

Change:
```jsx
import ChatPreview from '../components/ChatPreview';
```
To:
```jsx
import ChatBox from '../components/ChatBox';
```

Change (at the bottom of JSX, currently line 224):
```jsx
      <ChatPreview />
```
To:
```jsx
      <div className="detail-section">
        <h2 className="detail-section-title">경기 채팅방</h2>
        <ChatBox mode="match" matchId={matchId} isLoggedIn={isLoggedIn} />
      </div>
```

- [ ] **Step 2: Create ChatRoomPage.jsx**

`sportType` from URL params is lowercase (e.g., `soccer`). We uppercase it to match enum names (`SOCCER`) before passing to `ChatBox` and the API.

```jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ChatBox from '../components/ChatBox';

const SPORT_TABS = [
  { key: 'SOCCER', label: '축구' },
  { key: 'BASEBALL', label: '야구' },
  { key: 'ESPORTS', label: 'e스포츠' },
];

export default function ChatRoomPage() {
  const { sportType } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const current = SPORT_TABS.find(
    t => t.key === (sportType || '').toUpperCase()
  ) || SPORT_TABS[0];

  return (
    <div className="chat-room-page">
      <h1 className="page-title">팬 채팅</h1>
      <div className="chat-sport-tabs">
        {SPORT_TABS.map(tab => (
          <button
            key={tab.key}
            className={`btn ${current.key === tab.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => navigate(`/chat/${tab.key.toLowerCase()}`)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <ChatBox mode="sport" sportType={current.key} isLoggedIn={isLoggedIn} />
    </div>
  );
}
```

- [ ] **Step 3: Update AppRouter.jsx**

Add `ChatRoomPage` import and two new routes. Full updated file:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import Layout from '../components/Layout';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MatchListPage from '../pages/MatchListPage';
import MatchDetailPage from '../pages/MatchDetailPage';
import FavoritesPage from '../pages/FavoritesPage';
import SportsPage from '../pages/SportsPage';
import RankingsPage from '../pages/RankingsPage';
import ChatRoomPage from '../pages/ChatRoomPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import ErrorPage from '../pages/ErrorPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="matches" element={<MatchListPage />} />
            <Route path="matches/:matchId" element={<MatchDetailPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="sports/:sportType" element={<SportsPage />} />
            <Route path="rankings" element={<Navigate to="/rankings/soccer" replace />} />
            <Route path="rankings/:sportType" element={<RankingsPage />} />
            <Route path="chat" element={<Navigate to="/chat/soccer" replace />} />
            <Route path="chat/:sportType" element={<ChatRoomPage />} />
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<ErrorPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 4: Update Header.jsx — add Chat link**

Add `<Link to="/chat/soccer">Chat</Link>` between Favorites and Admin. Full updated file:

```jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, isLoggedIn, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">Sport Analysis Dashboard</Link>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/matches">Matches</Link>
          <Link to="/rankings/soccer">Rankings</Link>
          <Link to="/sports/soccer">Sports</Link>
          <Link to="/favorites">Favorites</Link>
          <Link to="/chat/soccer">Chat</Link>
          <Link to="/admin">Admin</Link>
        </nav>
        <div className="auth-section">
          {isLoggedIn ? (
            <>
              <span className="username">{user?.nickname || user?.username}</span>
              <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

---

### Task 6: CSS + verify builds

**Files:**
- Modify: `frontend/src/styles/components.css`

- [ ] **Step 1: Append chat styles to components.css**

Append at the very end of the file:

```css
/* ── Chat ──────────────────────────────── */
.chat-box {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--card-bg, #fff);
  border-bottom: 1px solid var(--border, #e5e7eb);
  font-weight: 600;
  font-size: 0.9rem;
}

.chat-refresh-btn {
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
}

.chat-message-list {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 200px;
  max-height: 360px;
  overflow-y: auto;
  background: var(--bg, #f9fafb);
}

.chat-message {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.chat-author {
  font-weight: 600;
  color: var(--accent, #6366f1);
  white-space: nowrap;
  flex-shrink: 0;
}

.chat-content {
  flex: 1;
  word-break: break-word;
}

.chat-time {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  white-space: nowrap;
  flex-shrink: 0;
}

.chat-notice {
  text-align: center;
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
  padding: 0.5rem 0;
  margin: 0;
}

.chat-login-notice {
  padding: 0.75rem 1rem;
  background: var(--card-bg, #fff);
  border-top: 1px solid var(--border, #e5e7eb);
  text-align: center;
}

.chat-input-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--card-bg, #fff);
  border-top: 1px solid var(--border, #e5e7eb);
}

.chat-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 0.375rem;
  font-size: 0.9rem;
  outline: none;
  background: var(--bg, #f9fafb);
}

.chat-input:focus {
  border-color: var(--accent, #6366f1);
  background: var(--card-bg, #fff);
}

.chat-send-btn {
  white-space: nowrap;
}

.chat-room-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.chat-sport-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .chat-message {
    flex-wrap: wrap;
  }

  .chat-time {
    order: 3;
    width: 100%;
    padding-left: 0;
  }
}
```

- [ ] **Step 2: Run frontend build**

```
cd frontend
npm run build
```

Expected: no errors, dist folder updated

- [ ] **Step 3: Compile backend**

```
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Non-logged-in users read chat | Task 3 — GET endpoints have no session check |
| Logged-in users write chat | Task 3 — POST endpoints call `requireLoginUserId` |
| Empty messages rejected | Task 3 — `content.isBlank()` check in `writeMessage` |
| Show username or nickname | Task 4 — `msg.nickname \|\| msg.username` in ChatBox |
| Match-specific chat | Task 3 + Task 5 — `/api/matches/{matchId}/chat`, ChatBox on MatchDetailPage |
| Sport-specific chat | Task 3 + Task 5 — `/api/chat/sports/{sportType}`, ChatRoomPage |
| MatchDetailPage shows match chat | Task 5 — replaces ChatPreview |
| ChatRoomPage with sport tabs | Task 5 — SOCCER/BASEBALL/ESPORTS tabs |
| `/chat/:sportType` route | Task 5 — AppRouter updated |
| Chat link in Header | Task 5 — `<Link to="/chat/soccer">Chat</Link>` |
| Avoid duplicate rooms | Task 3 — `getOrCreate*` pattern |
| `ChatRoomType` enum | Task 1 |
| All 5 DTOs | Tasks 1+2 |
| `findByRoomTypeAndMatchId` | Task 1 — ChatRoomRepository |
| `findByRoomTypeAndSportType` | Task 1 — ChatRoomRepository |
| `findTop50ByChatRoom...` | Task 1 — ChatMessageRepository |
| CSS | Task 6 |
| Builds pass | Task 6 |

**Placeholder scan:** None found. All steps contain complete code.

**Type consistency:**
- `ChatBox` props: `mode`, `matchId`, `sportType`, `isLoggedIn` — used consistently in Task 4 definition, Task 5 MatchDetailPage (`mode="match" matchId={matchId} isLoggedIn={isLoggedIn}`), and Task 5 ChatRoomPage (`mode="sport" sportType={current.key} isLoggedIn={isLoggedIn}`)
- `chatApi` functions: `getMatchChatMessages(matchId, signal)`, `sendMatchChatMessage(matchId, content)`, `getSportChatMessages(sportType, signal)`, `sendSportChatMessage(sportType, content)` — used exactly in ChatBox
- `ChatMessageResponse` fields: `id`, `roomId`, `userId`, `username`, `nickname`, `content`, `createdAt` — mapped in `ChatService.toResponse()`, accessed in ChatBox as `msg.id`, `msg.nickname`, `msg.username`, `msg.content`, `msg.createdAt` ✓

---

## Summary

**Backend files created:**
- `chat/ChatRoomType.java` (enum)
- `chat/entity/ChatRoom.java`
- `chat/entity/ChatMessage.java`
- `chat/repository/ChatRoomRepository.java`
- `chat/repository/ChatMessageRepository.java`
- `chat/dto/ChatRoomResponse.java`
- `chat/dto/ChatMessageResponse.java`
- `chat/dto/ChatMessageRequest.java`
- `chat/service/ChatService.java`
- `chat/controller/ChatController.java`

**Frontend files created:**
- `src/api/chatApi.js`
- `src/components/ChatBox.jsx`
- `src/pages/ChatRoomPage.jsx`

**Frontend files modified:**
- `src/pages/MatchDetailPage.jsx` — ChatPreview → ChatBox
- `src/router/AppRouter.jsx` — chat routes added
- `src/components/Header.jsx` — Chat link added
- `src/styles/components.css` — chat styles appended

**API endpoints:** `GET/POST /api/matches/{matchId}/chat`, `GET/POST /api/chat/sports/{sportType}`

**Not implemented:** WebSocket real-time (per spec), auto-poll (manual refresh button provided instead)

**How to test:**
1. Start backend: `.\mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to any match detail page → chat section at bottom
4. Navigate to `/chat/soccer` (or click Chat in header) → sport chat with tab buttons
5. Without login: input is hidden, notice shown
6. With login: type message, press Enter or 전송, message appears
