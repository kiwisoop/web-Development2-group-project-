# Phase 6: Fan Prediction Vote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full-stack fan prediction vote feature where users vote HOME_WIN / DRAW / AWAY_WIN before/during a match, see live percentages, and can change their vote.

**Architecture:** New `prediction` package in the backend (enum, entity, repository, DTOs, service, controller). REST endpoints `GET /api/matches/{matchId}/prediction` and `POST /api/matches/{matchId}/prediction/vote` wrapped in `ApiResponse`. Frontend fetches prediction on page load and refreshes after each vote. Vote changes are allowed (option A: update existing vote). All state flows from `MatchDetailPage` down to `PredictionPreview` as props.

**Tech Stack:** Spring Boot 3, JPA (Jakarta), Lombok, Oracle DB, React 18, Vite 8, axios, plain CSS

---

## Existing Patterns (follow exactly)

### Java
- Entity: `@Entity @Table @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`, ID via `@GeneratedValue(strategy = GenerationType.IDENTITY)`, timestamps via `LocalDateTime.now()`, enums via `@Enumerated(EnumType.STRING)`, relationships via `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn`
- Repository: `extends JpaRepository<Entity, Long>`, method-name queries, `@Query` with JPQL
- Service: `@Service @RequiredArgsConstructor`, `@Transactional` / `@Transactional(readOnly = true)`, errors via `throw new BusinessException("message")`
- Auth: `authService.requireLoginUserId(session)` → Long (throws if not logged in), `authService.getLoginUserId(session)` → Long or null
- Controller: `@RestController @RequestMapping("/api/...")`, session injected as method param, responses wrapped in `ApiResponse.ok(data)`
- Imports: `jakarta.persistence.*` (not `javax`), `com.sport.web_sport.common.error.BusinessException`, `com.sport.web_sport.common.response.ApiResponse`

### Frontend
- API module: thin axios wrappers in `frontend/src/api/`
- `ApiResponse` unwrap: `res.data.data` (body is `{ success, message, data }`)
- AbortController pattern in `useEffect`
- JavaScript only, no TypeScript, no Tailwind

---

## File Map

| Action | File |
|--------|------|
| Create | `src/main/java/com/sport/web_sport/prediction/VoteOption.java` |
| Create | `src/main/java/com/sport/web_sport/prediction/entity/PredictionVote.java` |
| Create | `src/main/java/com/sport/web_sport/prediction/repository/PredictionVoteRepository.java` |
| Create | `src/main/java/com/sport/web_sport/prediction/dto/PredictionVoteRequest.java` |
| Create | `src/main/java/com/sport/web_sport/prediction/dto/PredictionResultResponse.java` |
| Create | `src/main/java/com/sport/web_sport/prediction/service/PredictionService.java` |
| Create | `src/main/java/com/sport/web_sport/prediction/controller/PredictionController.java` |
| Create | `frontend/src/api/predictionApi.js` |
| Modify | `frontend/src/components/PredictionPreview.jsx` |
| Modify | `frontend/src/pages/MatchDetailPage.jsx` |
| Modify (append) | `frontend/src/styles/components.css` |

---

## Task 1: VoteOption Enum + PredictionVote Entity

**Files:**
- Create: `src/main/java/com/sport/web_sport/prediction/VoteOption.java`
- Create: `src/main/java/com/sport/web_sport/prediction/entity/PredictionVote.java`

- [ ] **Step 1: Create VoteOption enum**

```java
package com.sport.web_sport.prediction;

public enum VoteOption {
    HOME_WIN, DRAW, AWAY_WIN
}
```

- [ ] **Step 2: Create PredictionVote entity**

```java
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
```

**Notes:**
- `uniqueConstraints` prevents duplicate (match, user) pairs at the DB level. JPA will create this constraint via `spring.jpa.hibernate.ddl-auto`. If the DB already exists, this will add a new constraint on the new table — safe because `prediction_vote` is a brand-new table.
- `Match` is in `com.sport.web_sport.sports.entity`. `User` is in `com.sport.web_sport.user.entity`.

---

## Task 2: Repository + DTOs

**Files:**
- Create: `src/main/java/com/sport/web_sport/prediction/repository/PredictionVoteRepository.java`
- Create: `src/main/java/com/sport/web_sport/prediction/dto/PredictionVoteRequest.java`
- Create: `src/main/java/com/sport/web_sport/prediction/dto/PredictionResultResponse.java`

- [ ] **Step 1: Create PredictionVoteRepository**

```java
package com.sport.web_sport.prediction.repository;

import com.sport.web_sport.prediction.VoteOption;
import com.sport.web_sport.prediction.entity.PredictionVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PredictionVoteRepository extends JpaRepository<PredictionVote, Long> {
    Optional<PredictionVote> findByMatchIdAndUserId(Long matchId, Long userId);
    boolean existsByMatchIdAndUserId(Long matchId, Long userId);
    long countByMatchIdAndVoteOption(Long matchId, VoteOption voteOption);
    long countByMatchId(Long matchId);
}
```

- [ ] **Step 2: Create PredictionVoteRequest DTO**

```java
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
```

- [ ] **Step 3: Create PredictionResultResponse DTO**

```java
package com.sport.web_sport.prediction.dto;

import com.sport.web_sport.prediction.VoteOption;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PredictionResultResponse {
    private Long matchId;
    private long totalVotes;
    private long homeWinCount;
    private long drawCount;
    private long awayWinCount;
    private double homeWinPercent;
    private double drawPercent;
    private double awayWinPercent;
    private VoteOption myVote;
    private boolean canVote;

    public static PredictionResultResponse of(
            Long matchId,
            long homeWin,
            long draw,
            long awayWin,
            VoteOption myVote,
            boolean canVote) {
        long total = homeWin + draw + awayWin;
        double homePct  = total > 0 ? Math.round(homeWin * 1000.0 / total) / 10.0 : 0.0;
        double drawPct  = total > 0 ? Math.round(draw    * 1000.0 / total) / 10.0 : 0.0;
        double awayPct  = total > 0 ? Math.round(awayWin * 1000.0 / total) / 10.0 : 0.0;
        return PredictionResultResponse.builder()
                .matchId(matchId)
                .totalVotes(total)
                .homeWinCount(homeWin)
                .drawCount(draw)
                .awayWinCount(awayWin)
                .homeWinPercent(homePct)
                .drawPercent(drawPct)
                .awayWinPercent(awayPct)
                .myVote(myVote)
                .canVote(canVote)
                .build();
    }
}
```

**Notes:**
- Percentages use `Math.round(...* 1000.0 / total) / 10.0` for one-decimal precision.
- `myVote` is `null` for anonymous users or users who haven't voted yet.
- `canVote` is set by the service based on match status (false for FINAL/CANCELLED).

---

## Task 3: PredictionService

**Files:**
- Create: `src/main/java/com/sport/web_sport/prediction/service/PredictionService.java`

- [ ] **Step 1: Create PredictionService**

```java
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
```

**Notes:**
- `getPredictionResult` uses `getLoginUserId` (returns null if anonymous) — anonymous users see results, just no `myVote`.
- `vote` uses `requireLoginUserId` — throws if not logged in.
- Duplicate vote → updates existing (option A per spec). The unique constraint at DB level prevents race conditions.
- `isVotableStatus` uses string comparison to avoid needing to import MatchStatus enum.
- In `vote`, the returned `myVote` is the `voteOption` just cast (always correct since we just saved it).
- `MatchRepository` is in `com.sport.web_sport.sports.repository`. `UserRepository` is in `com.sport.web_sport.user.repository`.

---

## Task 4: PredictionController + Backend Compile

**Files:**
- Create: `src/main/java/com/sport/web_sport/prediction/controller/PredictionController.java`

- [ ] **Step 1: Create PredictionController**

```java
package com.sport.web_sport.prediction.controller;

import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.prediction.dto.PredictionResultResponse;
import com.sport.web_sport.prediction.dto.PredictionVoteRequest;
import com.sport.web_sport.prediction.service.PredictionService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matches/{matchId}/prediction")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    @GetMapping
    public ApiResponse<PredictionResultResponse> getResult(
            @PathVariable Long matchId,
            HttpSession session) {
        return ApiResponse.ok(predictionService.getPredictionResult(matchId, session));
    }

    @PostMapping("/vote")
    public ApiResponse<PredictionResultResponse> vote(
            @PathVariable Long matchId,
            @RequestBody PredictionVoteRequest request,
            HttpSession session) {
        return ApiResponse.ok(predictionService.vote(matchId, request.getVoteOption(), session));
    }
}
```

- [ ] **Step 2: Verify backend compiles**

```powershell
cd "E:\web3\web-sport-react-rebuild"
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

Common failures:
- `cannot find symbol: MatchRepository` → check import `com.sport.web_sport.sports.repository.MatchRepository`
- `cannot find symbol: UserRepository` → check import `com.sport.web_sport.user.repository.UserRepository`
- `cannot find symbol: BusinessException` → check import `com.sport.web_sport.common.error.BusinessException`
- `cannot find symbol: ApiResponse` → check import `com.sport.web_sport.common.response.ApiResponse`

---

## Task 5: Create `predictionApi.js`

**Files:**
- Create: `frontend/src/api/predictionApi.js`

- [ ] **Step 1: Create the file**

```js
import axiosInstance from './axiosInstance';

export const getPredictionResult = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/prediction`, { signal });

export const votePrediction = (matchId, voteOption) =>
  axiosInstance.post(`/matches/${matchId}/prediction/vote`, { voteOption });
```

**Notes:**
- `getPredictionResult` takes a signal for AbortController support.
- `votePrediction` sends `{ voteOption: "HOME_WIN" }` as JSON body. The backend `@RequestBody PredictionVoteRequest` will deserialize `voteOption` via Jackson.
- Both endpoints return `ApiResponse<PredictionResultResponse>` — access result via `res.data.data`.

---

## Task 6: Update `PredictionPreview.jsx`

**Files:**
- Modify: `frontend/src/components/PredictionPreview.jsx`

Replace the entire file. The previous version was a static placeholder with no props.

- [ ] **Step 1: Replace the entire file**

```jsx
function VoteButton({ option, label, count, percent, myVote, disabled, onVote }) {
  const isSelected = myVote === option;
  return (
    <div className={`vote-option${isSelected ? ' vote-selected' : ''}`}>
      <button
        className={`btn vote-button${isSelected ? ' btn-primary' : ' btn-outline'}`}
        onClick={() => onVote(option)}
        disabled={disabled}
      >
        {label}
      </button>
      <div className="vote-bar-wrap">
        <div className="vote-bar" style={{ width: `${percent}%` }} />
      </div>
      <span className="vote-percent">{percent}%</span>
      <span className="vote-count">({count}표)</span>
    </div>
  );
}

export default function PredictionPreview({ matchStatus, prediction, isLoggedIn, onVote, voting }) {
  if (!prediction) return null;

  const {
    homeWinCount, drawCount, awayWinCount,
    homeWinPercent, drawPercent, awayWinPercent,
    totalVotes, myVote, canVote,
  } = prediction;

  const isFinal = matchStatus === 'FINAL';
  const disabled = voting || !isLoggedIn || !canVote;

  return (
    <div className="detail-section">
      <h2 className="detail-section-title">팬 승부 예측</h2>
      <div className="prediction-card card">
        <div className="vote-options">
          <VoteButton
            option="HOME_WIN" label="홈 승"
            count={homeWinCount} percent={homeWinPercent}
            myVote={myVote} disabled={disabled} onVote={onVote}
          />
          <VoteButton
            option="DRAW" label="무승부"
            count={drawCount} percent={drawPercent}
            myVote={myVote} disabled={disabled} onVote={onVote}
          />
          <VoteButton
            option="AWAY_WIN" label="원정 승"
            count={awayWinCount} percent={awayWinPercent}
            myVote={myVote} disabled={disabled} onVote={onVote}
          />
        </div>
        <p className="vote-total">총 {totalVotes}표</p>
        {!isLoggedIn && (
          <p className="notice-text">로그인 후 예측 투표에 참여할 수 있습니다.</p>
        )}
        {isLoggedIn && isFinal && (
          <p className="notice-text">경기 종료 후에는 투표할 수 없습니다.</p>
        )}
      </div>
    </div>
  );
}
```

**Notes:**
- `VoteButton` is defined outside the component (prevents remount on each render).
- `disabled` is true when: currently voting, not logged in, or `canVote` is false (FINAL/CANCELLED).
- `myVote` is the enum string: `"HOME_WIN"`, `"DRAW"`, or `"AWAY_WIN"` — compared directly with `option` string.
- `prediction` may be `null` on initial load — return null to avoid errors.
- No API calls inside this component — all data comes from props.

---

## Task 7: Update `MatchDetailPage.jsx`

**Files:**
- Modify: `frontend/src/pages/MatchDetailPage.jsx`

- [ ] **Step 1: Replace the entire file**

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMatchDetailFull } from '../api/matchApi';
import { getFavoriteTeams, addFavoriteTeam, removeFavoriteTeam } from '../api/favoriteApi';
import { generateMatchAnalysis, regenerateMatchAnalysis } from '../api/analysisApi';
import { getPredictionResult, votePrediction } from '../api/predictionApi';
import { useAuth } from '../hooks/useAuth';
import Scoreboard from '../components/Scoreboard';
import StatCard from '../components/StatCard';
import TimelineItem from '../components/TimelineItem';
import MatchActionPanel from '../components/MatchActionPanel';
import AiAnalysisPreview from '../components/AiAnalysisPreview';
import PredictionPreview from '../components/PredictionPreview';
import ChatPreview from '../components/ChatPreview';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';

export default function MatchDetailPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [loadingTeamId, setLoadingTeamId] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [analysisGenerating, setAnalysisGenerating] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const [prediction, setPrediction] = useState(null);
  const [predictionVoting, setPredictionVoting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getMatchDetailFull(matchId, controller.signal)
      .then((res) => {
        setData(res.data);
        setAnalysis(res.data.analysis);
      })
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('경기 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [matchId]);

  useEffect(() => {
    if (!isLoggedIn) {
      setFavoriteTeams([]);
      return;
    }
    const controller = new AbortController();
    getFavoriteTeams(controller.signal)
      .then((res) => setFavoriteTeams(res.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, [isLoggedIn]);

  useEffect(() => {
    const controller = new AbortController();
    getPredictionResult(matchId, controller.signal)
      .then((res) => setPrediction(res.data.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, [matchId, isLoggedIn]);

  const handleToggleFavorite = async (teamId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setLoadingTeamId(teamId);
    try {
      const existing = favoriteTeams.find((f) => f.teamId === teamId);
      if (existing) {
        await removeFavoriteTeam(existing.id);
        setFavoriteTeams((prev) => prev.filter((f) => f.teamId !== teamId));
      } else {
        const res = await addFavoriteTeam(teamId);
        setFavoriteTeams((prev) => [...prev, res.data.favorite]);
      }
    } catch {
      // non-critical
    } finally {
      setLoadingTeamId(null);
    }
  };

  const handleGenerate = async () => {
    setAnalysisGenerating(true);
    setAnalysisError(null);
    try {
      const res = await generateMatchAnalysis(matchId);
      setAnalysis(res.data);
    } catch {
      setAnalysisError('분석 생성 중 오류가 발생했습니다.');
    } finally {
      setAnalysisGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setAnalysisGenerating(true);
    setAnalysisError(null);
    try {
      const res = await regenerateMatchAnalysis(matchId);
      setAnalysis(res.data);
    } catch {
      setAnalysisError('분석 재생성 중 오류가 발생했습니다.');
    } finally {
      setAnalysisGenerating(false);
    }
  };

  const handleVote = async (voteOption) => {
    if (!isLoggedIn) return;
    setPredictionVoting(true);
    try {
      const res = await votePrediction(matchId, voteOption);
      setPrediction(res.data.data);
    } catch {
      // silently fail — button re-enables via finally
    } finally {
      setPredictionVoting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (error) return (
    <div className="match-detail-page">
      <Link to="/matches" className="back-link">← 경기 목록으로</Link>
      <ErrorBox message={error} />
    </div>
  );

  if (!data) return (
    <div className="match-detail-page">
      <Link to="/matches" className="back-link">← 경기 목록으로</Link>
      <EmptyState title="경기를 찾을 수 없습니다" description="목록으로 돌아가서 다시 시도해 보세요." />
    </div>
  );

  const { match, stats, events } = data;
  const showData = match.status === 'LIVE' || match.status === 'FINAL';
  const favoriteTeamIds = new Set(favoriteTeams.map((f) => f.teamId));

  return (
    <div className="match-detail-page">
      <Link to="/matches" className="back-link">← 경기 목록으로</Link>

      <Scoreboard match={match} />

      {match.status === 'SCHEDULED' && (
        <div className="status-notice card">경기 시작 전입니다.</div>
      )}

      {match.status === 'CANCELLED' && (
        <div className="status-notice card">이 경기는 취소되었습니다.</div>
      )}

      <MatchActionPanel
        match={match}
        isLoggedIn={isLoggedIn}
        favoriteTeamIds={favoriteTeamIds}
        onToggleFavorite={handleToggleFavorite}
        loadingTeamId={loadingTeamId}
      />

      {analysisError && <ErrorBox message={analysisError} />}

      <AiAnalysisPreview
        matchStatus={match.status}
        analysis={analysis}
        onGenerate={handleGenerate}
        onRegenerate={handleRegenerate}
        generating={analysisGenerating}
      />

      <PredictionPreview
        matchStatus={match.status}
        prediction={prediction}
        isLoggedIn={isLoggedIn}
        onVote={handleVote}
        voting={predictionVoting}
      />

      {showData && stats && stats.length > 0 && (
        <div className="detail-section">
          <h2 className="detail-section-title">경기 통계</h2>
          <div className="stats-grid">
            {stats.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>
        </div>
      )}

      {showData && events && events.length > 0 && (
        <div className="detail-section">
          <h2 className="detail-section-title">이벤트 타임라인</h2>
          <div className="timeline">
            {events.map((event) => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      <ChatPreview />
    </div>
  );
}
```

**Key changes from previous version:**
- Added `getPredictionResult, votePrediction` import
- Added `prediction` (null) and `predictionVoting` (false) state
- Added prediction `useEffect` (depends on `[matchId, isLoggedIn]` — refreshes when auth changes)
- Added `handleVote` — calls API, updates `prediction` state from response
- `<PredictionPreview>` now receives 5 props instead of none

---

## Task 8: Append CSS to `components.css`

**Files:**
- Modify (append only): `frontend/src/styles/components.css`

- [ ] **Step 1: Append CSS to end of file**

```css
/* ===== Prediction Card ===== */
.prediction-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ===== Vote options row ===== */
.vote-options {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ===== Individual vote option ===== */
.vote-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
  min-width: 80px;
}

/* ===== Vote button ===== */
.vote-button {
  width: 100%;
  font-size: 0.85rem;
}

/* ===== Vote bar ===== */
.vote-bar-wrap {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.vote-bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 0.4s ease;
  min-width: 0;
}

/* ===== Vote labels ===== */
.vote-percent {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text);
}

.vote-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.vote-total {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-align: center;
}

/* ===== Selected vote highlight ===== */
.vote-selected .vote-bar {
  background: var(--color-primary);
  opacity: 1;
}

.vote-selected .vote-percent {
  color: var(--color-primary);
}
```

---

## Task 9: Verify Builds

**Files:** none

- [ ] **Step 1: Run frontend build**

```powershell
cd "E:\web3\web-sport-react-rebuild\frontend"
npm run build
```

Expected: `✓ built in Xs` with no errors.

Common failures:
- `Cannot find module '../api/predictionApi'` → verify `src/api/predictionApi.js` exists
- Props warning on PredictionPreview → check all 5 props are passed from MatchDetailPage
- JSX error → ensure file is `.jsx` extension

- [ ] **Step 2: Run backend compile**

```powershell
cd "E:\web3\web-sport-react-rebuild"
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

---

## Summary

### Backend Files Created
| File | Purpose |
|------|---------|
| `...prediction/VoteOption.java` | Enum: HOME_WIN, DRAW, AWAY_WIN |
| `...prediction/entity/PredictionVote.java` | JPA entity with unique(match, user) constraint |
| `...prediction/repository/PredictionVoteRepository.java` | findByMatchIdAndUserId, countBy* |
| `...prediction/dto/PredictionVoteRequest.java` | Request body: `{ voteOption }` |
| `...prediction/dto/PredictionResultResponse.java` | Response with counts, %, myVote, canVote |
| `...prediction/service/PredictionService.java` | Get result + vote logic |
| `...prediction/controller/PredictionController.java` | GET /prediction + POST /prediction/vote |

### Frontend Files Created/Modified
| File | Change |
|------|--------|
| `frontend/src/api/predictionApi.js` | New — 2 API functions |
| `frontend/src/components/PredictionPreview.jsx` | Full rewrite with real vote UI |
| `frontend/src/pages/MatchDetailPage.jsx` | Added prediction state + handlers |
| `frontend/src/styles/components.css` | Appended prediction/vote styles |

### Duplicate Vote Handling
**Option A (update existing vote):** If a user votes again, their existing `PredictionVote` record is updated with the new `voteOption`. The unique constraint `(match_id, user_id)` prevents race conditions but allows intentional updates via the service layer.

### How to Test
1. Start backend: `.\mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Open a SCHEDULED/LIVE match as anonymous user → see vote bars (all 0%), buttons disabled with login notice
4. Log in → buttons become active
5. Click "홈 승" → bar updates, button highlights with `btn-primary`
6. Click "무승부" → vote changes, previous selection deselects
7. Open a FINAL match → buttons disabled with "경기 종료 후에는 투표할 수 없습니다."
8. Check `GET http://localhost:8080/api/matches/{id}/prediction` directly in browser

### What Was Intentionally NOT Implemented
- DRAW hidden for baseball/esports (deferred to future)
- Pre-match AI win prediction (different feature)
- Chat, rankings, MLB API

### Next Recommended Step
**Phase 7: Match chat room** — implement WebSocket-based match chat (or polling-based if simpler), replacing the ChatPreview placeholder.
