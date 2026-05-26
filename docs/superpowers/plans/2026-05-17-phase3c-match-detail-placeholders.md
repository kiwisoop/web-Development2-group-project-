# Phase 3C: MatchDetailPage Placeholder Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four placeholder UI sections to MatchDetailPage (favorites, AI analysis, fan prediction, match chat) so the layout is ready for future feature implementation without any real API connections.

**Architecture:** Four new focused components (MatchActionPanel, AiAnalysisPreview, PredictionPreview, ChatPreview) are created as pure display placeholders with no API calls. MatchDetailPage is updated to import and render them in the correct visual order. All buttons are `disabled`. No backend changes.

**Tech Stack:** React 18, Vite 8, plain CSS (no TypeScript, no Tailwind, no UI libraries)

---

## Current MatchDetailPage visual order (before this phase)

1. Back link
2. Scoreboard
3. SCHEDULED / CANCELLED notice (conditional)
4. Stats section (LIVE/FINAL only)
5. Timeline section (LIVE/FINAL only)

## New MatchDetailPage visual order (after this phase)

1. Back link
2. Scoreboard
3. SCHEDULED / CANCELLED notice (conditional)
4. **MatchActionPanel** ← new
5. **AiAnalysisPreview** ← new
6. **PredictionPreview** ← new
7. Stats section (LIVE/FINAL only)
8. Timeline section (LIVE/FINAL only)
9. **ChatPreview** ← new

---

## File Map

| Action | File |
|--------|------|
| Create | `frontend/src/components/MatchActionPanel.jsx` |
| Create | `frontend/src/components/AiAnalysisPreview.jsx` |
| Create | `frontend/src/components/PredictionPreview.jsx` |
| Create | `frontend/src/components/ChatPreview.jsx` |
| Modify (append) | `frontend/src/styles/components.css` |
| Modify | `frontend/src/pages/MatchDetailPage.jsx` |

---

## Task 1: Create `MatchActionPanel.jsx`

**Files:**
- Create: `frontend/src/components/MatchActionPanel.jsx`

- [x] **Step 1: Create the file**

```jsx
export default function MatchActionPanel({ match }) {
  return (
    <div className="detail-section">
      <h2 className="detail-section-title">관심 팀</h2>
      <div className="action-panel card">
        <div className="action-row">
          <span className="action-team-name">{match.homeTeam?.teamName || '홈팀'}</span>
          <button className="btn btn-outline" disabled>관심 팀 등록 준비 중</button>
        </div>
        <div className="action-row">
          <span className="action-team-name">{match.awayTeam?.teamName || '원정팀'}</span>
          <button className="btn btn-outline" disabled>관심 팀 등록 준비 중</button>
        </div>
        <p className="notice-text">로그인 후 관심 팀을 등록할 수 있습니다.</p>
      </div>
    </div>
  );
}
```

**Props:** `match` — the `.match` object from the detail-full response. `homeTeam` and `awayTeam` may be null; optional chaining guards against this.

---

## Task 2: Create `AiAnalysisPreview.jsx`

**Files:**
- Create: `frontend/src/components/AiAnalysisPreview.jsx`

- [x] **Step 1: Create the file**

```jsx
export default function AiAnalysisPreview() {
  return (
    <div className="detail-section">
      <h2 className="detail-section-title">AI 경기 분석</h2>
      <div className="preview-grid">
        <div className="preview-card card">
          <h3 className="preview-card-title">경기 결과 분석</h3>
          <p className="preview-card-desc">
            경기 종료 후 Gemini가 승리 요인, 패배 요인, 핵심 장면을 분석합니다.
          </p>
          <button className="btn btn-outline" disabled>결과 분석 준비 중</button>
        </div>
        <div className="preview-card card">
          <h3 className="preview-card-title">경기 전 승패 전망</h3>
          <p className="preview-card-desc">
            백엔드가 계산한 지표를 바탕으로 Gemini가 팬이 이해하기 쉬운 설명을 제공합니다.
          </p>
          <button className="btn btn-outline" disabled>승패 전망 준비 중</button>
        </div>
      </div>
    </div>
  );
}
```

**No props needed.** Both cards are static placeholders.

---

## Task 3: Create `PredictionPreview.jsx`

**Files:**
- Create: `frontend/src/components/PredictionPreview.jsx`

- [x] **Step 1: Create the file**

```jsx
export default function PredictionPreview() {
  return (
    <div className="detail-section">
      <h2 className="detail-section-title">팬 승부 예측</h2>
      <div className="preview-card card">
        <div className="prediction-buttons">
          <button className="btn btn-outline" disabled>HOME_WIN</button>
          <button className="btn btn-outline" disabled>DRAW</button>
          <button className="btn btn-outline" disabled>AWAY_WIN</button>
        </div>
        <p className="notice-text">경기 시작 전 팬들이 승부를 예측할 수 있는 기능입니다.</p>
      </div>
    </div>
  );
}
```

**No props needed.** Button labels use the backend enum values (HOME_WIN, DRAW, AWAY_WIN) as specified. Real labels with team names will be wired in a future phase.

---

## Task 4: Create `ChatPreview.jsx`

**Files:**
- Create: `frontend/src/components/ChatPreview.jsx`

- [x] **Step 1: Create the file**

```jsx
export default function ChatPreview() {
  return (
    <div className="detail-section">
      <h2 className="detail-section-title">경기 채팅방</h2>
      <div className="preview-card card">
        <p className="preview-card-desc">
          팬들과 경기별로 대화할 수 있는 채팅방 기능은 추후 제공 예정입니다.
        </p>
        <button className="btn btn-outline" disabled>채팅방 준비 중</button>
      </div>
    </div>
  );
}
```

**No props needed.** Static placeholder.

---

## Task 5: Append Placeholder CSS to `components.css`

**Files:**
- Modify (append only): `frontend/src/styles/components.css`

Do NOT replace the file. Append the following block to the very end of the existing file.

- [x] **Step 1: Append CSS**

```css
/* ===== Detail Section wrapper ===== */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ===== Action Panel (Favorites) ===== */
.action-panel {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-team-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text);
}

/* ===== Notice text ===== */
.notice-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

/* ===== Preview grid (AI analysis — 2 cards side by side) ===== */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .preview-grid { grid-template-columns: 1fr; }
}

/* ===== Preview card ===== */
.preview-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preview-card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}

.preview-card-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* ===== Prediction buttons ===== */
.prediction-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ===== Disabled button state ===== */
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
```

---

## Task 6: Update `MatchDetailPage.jsx`

**Files:**
- Modify: `frontend/src/pages/MatchDetailPage.jsx`

The current file has these imports at the top:
```jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchDetailFull } from '../api/matchApi';
import Scoreboard from '../components/Scoreboard';
import StatCard from '../components/StatCard';
import TimelineItem from '../components/TimelineItem';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';
```

And the happy-path return currently is (lines 52–89):
```jsx
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
    </div>
  );
```

- [x] **Step 1: Add 4 new imports after the existing ErrorBox import**

Use Edit to add these 4 lines after line 9 (`import ErrorBox from '../components/ErrorBox';`):
```jsx
import MatchActionPanel from '../components/MatchActionPanel';
import AiAnalysisPreview from '../components/AiAnalysisPreview';
import PredictionPreview from '../components/PredictionPreview';
import ChatPreview from '../components/ChatPreview';
```

- [x] **Step 2: Replace the happy-path return block**

Use Edit to replace the entire return statement (from `return (` to the closing `);`) with:

```jsx
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

      <MatchActionPanel match={match} />

      <AiAnalysisPreview />

      <PredictionPreview />

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
```

After both edits, the full file should be:

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchDetailFull } from '../api/matchApi';
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getMatchDetailFull(matchId, controller.signal)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('경기 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [matchId]);

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

      <MatchActionPanel match={match} />

      <AiAnalysisPreview />

      <PredictionPreview />

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

---

## Task 7: Verify Build

- [x] **Step 1: Run frontend build**

```powershell
cd "E:\web3\web-sport-react-rebuild\frontend"
npm run build
```

Expected: `✓ built in Xs`

If build fails:
- `Cannot find module '../components/MatchActionPanel'` → verify file exists at `src/components/MatchActionPanel.jsx`
- `Cannot find module '../components/AiAnalysisPreview'` → verify `AiAnalysisPreview.jsx` exists
- `Cannot find module '../components/PredictionPreview'` → verify `PredictionPreview.jsx` exists
- `Cannot find module '../components/ChatPreview'` → verify `ChatPreview.jsx` exists
- JSX error in `.js` file → rename to `.jsx`

- [x] **Step 2: Run backend compile**

```powershell
cd "E:\web3\web-sport-react-rebuild"
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

---

## Summary

### Files Created
| File | Purpose |
|------|---------|
| `frontend/src/components/MatchActionPanel.jsx` | Placeholder for future favorite-team registration (both teams, disabled buttons) |
| `frontend/src/components/AiAnalysisPreview.jsx` | Placeholder for Gemini analysis (2 cards: result analysis + pre-match outlook) |
| `frontend/src/components/PredictionPreview.jsx` | Placeholder for fan vote (HOME_WIN / DRAW / AWAY_WIN disabled buttons) |
| `frontend/src/components/ChatPreview.jsx` | Placeholder for match chat room |

### Files Modified
| File | Change |
|------|--------|
| `frontend/src/styles/components.css` | Appended `.detail-section`, `.action-panel`, `.preview-grid`, `.preview-card`, `.prediction-buttons`, `.btn:disabled`, `.notice-text` |
| `frontend/src/pages/MatchDetailPage.jsx` | Added 4 imports; inserted MatchActionPanel, AiAnalysisPreview, PredictionPreview between Scoreboard and stats; added ChatPreview at bottom |

### What was intentionally NOT implemented
- No API calls in any placeholder component
- No favorite team registration logic
- No Gemini analysis calls
- No prediction vote backend
- No chat websocket/backend

### How to Test
1. Start backend: `.\mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Open any match detail: `http://localhost:5173/matches/{id}`
4. Verify visual order: Scoreboard → 관심 팀 → AI 경기 분석 → 팬 승부 예측 → (stats if LIVE/FINAL) → (timeline if LIVE/FINAL) → 경기 채팅방
5. Verify all buttons are disabled (cursor: not-allowed, dimmed)
6. Verify layout is responsive (AI grid stacks on mobile)

### Next Recommended Step
**Phase 4A: Implement real favorite team registration** — wire up MatchActionPanel to `POST /api/favorites` with auth state from `useAuth()`, replacing the disabled buttons with functional toggle buttons.
