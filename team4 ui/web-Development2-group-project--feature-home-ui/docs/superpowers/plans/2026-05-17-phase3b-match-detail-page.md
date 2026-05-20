# Phase 3B: MatchDetailPage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the MatchDetailPage placeholder with a fully functional match detail view connected to `GET /api/matches/{id}/detail-full`, showing scoreboard, stats, and event timeline.

**Architecture:** A single call to `/detail-full` fetches all needed data (match, stats, events). The page renders a `Scoreboard` header, then conditionally renders stats and timeline only for LIVE/FINAL matches. SCHEDULED/CANCELLED matches show a status notice instead. Three focused sub-components (`Scoreboard`, `StatCard`, `TimelineItem`) handle rendering. No backend changes required.

**Tech Stack:** React 18, react-router-dom v7 (`useParams`, `Link`), axios, plain CSS

---

## Backend API — Already Exists, No Changes Needed

**Primary endpoint:** `GET /api/matches/{id}/detail-full`

**Returns** `MatchDetailFullResponse` (no `ApiResponse` wrapper):
```json
{
  "match": {
    "id": 1,
    "sportType": "SOCCER",
    "status": "FINAL",
    "season": "2025-26",
    "matchDate": "2026-05-17T15:00:00",
    "venue": "Wembley Stadium",
    "homeScore": 2,
    "awayScore": 1,
    "league": { "id": 1, "leagueName": "Premier League", "sportType": "SOCCER", "season": "2025-26", "country": "England" },
    "homeTeam": { "id": 1, "teamName": "Manchester City", "shortName": "MCI", "sportType": "SOCCER", "leagueId": 1, "leagueName": "Premier League", "logoUrl": null, "country": "England" },
    "awayTeam": { "id": 2, "teamName": "Arsenal", "shortName": "ARS", ... }
  },
  "homeTeam": { ...TeamResponse },
  "awayTeam": { ...TeamResponse },
  "league": { ...LeagueResponse },
  "stats": [
    { "id": 1, "teamId": 1, "teamName": "Manchester City", "statName": "볼점유율", "statValue": "65%" }
  ],
  "events": [
    {
      "id": 1, "teamId": 1, "teamName": "Manchester City",
      "playerId": 10, "playerName": "Haaland",
      "eventTime": "23'", "eventType": "GOAL",
      "description": "득점", "scoreAfterEvent": "1-0"
    }
  ],
  "analysis": { "id": null, "status": "NOT_CREATED" },
  "analysisStatus": "NOT_CREATED",
  "homeTeamFavorite": false,
  "awayTeamFavorite": false,
  "loggedIn": false
}
```

**Fields we use:** `match`, `stats`, `events`

**Fields we ignore (not yet implemented):** `analysis`, `analysisStatus`, `homeTeamFavorite`, `awayTeamFavorite`, `loggedIn`

**Also available but not needed for primary page:**
- `GET /api/matches/{id}` → `MatchResponse`
- `GET /api/matches/{id}/stats` → `List<MatchStatResponse>`
- `GET /api/matches/{id}/events` → `List<MatchEventResponse>`

---

## File Map

| Action | File |
|--------|------|
| Modify | `frontend/src/api/matchApi.js` |
| Create | `frontend/src/components/Scoreboard.jsx` |
| Create | `frontend/src/components/StatCard.jsx` |
| Create | `frontend/src/components/TimelineItem.jsx` |
| Modify (append) | `frontend/src/styles/components.css` |
| Overwrite | `frontend/src/pages/MatchDetailPage.jsx` |

---

## Task 1: Update `matchApi.js`

**Files:**
- Modify: `frontend/src/api/matchApi.js`

- [ ] **Step 1: Overwrite the file with all 5 functions**

Current content is:
```js
import axiosInstance from './axiosInstance';

export const getMatches = (params, signal) => axiosInstance.get('/matches', { params, signal });
```

New content (add 4 functions):
```js
import axiosInstance from './axiosInstance';

export const getMatches = (params, signal) => axiosInstance.get('/matches', { params, signal });

export const getMatch = (matchId, signal) => axiosInstance.get(`/matches/${matchId}`, { signal });

export const getMatchStats = (matchId, signal) => axiosInstance.get(`/matches/${matchId}/stats`, { signal });

export const getMatchEvents = (matchId, signal) => axiosInstance.get(`/matches/${matchId}/events`, { signal });

export const getMatchDetailFull = (matchId, signal) => axiosInstance.get(`/matches/${matchId}/detail-full`, { signal });
```

---

## Task 2: Create `Scoreboard.jsx`

**Files:**
- Create: `frontend/src/components/Scoreboard.jsx`

- [ ] **Step 1: Create the file**

```jsx
import StatusBadge from './StatusBadge';

const SPORT_LABELS = {
  SOCCER: '⚽ 축구',
  BASEBALL: '⚾ 야구',
  ESPORTS: '🎮 E스포츠',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Scoreboard({ match }) {
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;

  return (
    <div className="scoreboard card">
      <div className="scoreboard-meta">
        <span className="sport-label">{SPORT_LABELS[match.sportType] || match.sportType}</span>
        <StatusBadge status={match.status} />
        {match.league && <span className="scoreboard-league">{match.league.leagueName}</span>}
      </div>

      <div className="scoreboard-teams">
        <div className="team-block">
          <span className="team-block-name">{match.homeTeam?.teamName || '홈팀'}</span>
        </div>

        <div className="score-display">
          {hasScore ? (
            <>
              <span className="score-num">{match.homeScore}</span>
              <span className="score-sep">:</span>
              <span className="score-num">{match.awayScore}</span>
            </>
          ) : (
            <span className="score-sep">VS</span>
          )}
        </div>

        <div className="team-block">
          <span className="team-block-name">{match.awayTeam?.teamName || '원정팀'}</span>
        </div>
      </div>

      <div className="scoreboard-footer">
        {match.matchDate && <span>{formatDate(match.matchDate)}</span>}
        {match.venue && <span>📍 {match.venue}</span>}
      </div>
    </div>
  );
}
```

---

## Task 3: Create `StatCard.jsx`

**Files:**
- Create: `frontend/src/components/StatCard.jsx`

- [ ] **Step 1: Create the file**

```jsx
export default function StatCard({ stat }) {
  return (
    <div className="stat-card card">
      <p className="stat-team">{stat.teamName}</p>
      <p className="stat-name">{stat.statName}</p>
      <p className="stat-value">{stat.statValue}</p>
    </div>
  );
}
```

---

## Task 4: Create `TimelineItem.jsx`

**Files:**
- Create: `frontend/src/components/TimelineItem.jsx`

- [ ] **Step 1: Create the file**

```jsx
export default function TimelineItem({ event }) {
  return (
    <div className="timeline-item">
      <span className="timeline-time">{event.eventTime || '-'}</span>
      <div className="timeline-body">
        <span className="timeline-type">{event.eventType}</span>
        {event.teamName && <span className="timeline-team">{event.teamName}</span>}
        {event.playerName && <span className="timeline-player">{event.playerName}</span>}
        {event.description && <span className="timeline-desc">{event.description}</span>}
      </div>
      {event.scoreAfterEvent && (
        <span className="timeline-score">{event.scoreAfterEvent}</span>
      )}
    </div>
  );
}
```

---

## Task 5: Append Detail Page CSS to `components.css`

**Files:**
- Modify (append only): `frontend/src/styles/components.css`

Do NOT replace the file. Append the following block to the very end of the existing file.

- [ ] **Step 1: Append CSS**

```css
/* ===== Match Detail Page ===== */
.match-detail-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}

.back-link:hover { text-decoration: underline; }

/* Scoreboard */
.scoreboard {
  text-align: center;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.scoreboard-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.sport-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.scoreboard-league {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.scoreboard-teams {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  width: 100%;
}

.team-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 180px;
}

.team-block-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
  word-break: break-word;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.score-num {
  font-size: 3rem;
  font-weight: 900;
  color: var(--color-primary);
  line-height: 1;
}

.score-sep {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.scoreboard-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* Status notice */
.status-notice {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
  font-size: 1rem;
  font-weight: 500;
}

/* Detail sections */
.detail-section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--color-text);
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
}

/* Stat card */
.stat-card {
  padding: 1rem 1.25rem;
  text-align: center;
}

.stat-team {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-name {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.35rem;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-primary);
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
}

.timeline-time {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary);
  min-width: 36px;
  flex-shrink: 0;
}

.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}

.timeline-type {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text);
}

.timeline-team {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.timeline-player {
  font-size: 0.8rem;
  color: var(--color-text);
  font-weight: 600;
}

.timeline-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.timeline-score {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary);
  flex-shrink: 0;
}
```

---

## Task 6: Implement `MatchDetailPage.jsx`

**Files:**
- Overwrite: `frontend/src/pages/MatchDetailPage.jsx`

- [ ] **Step 1: Overwrite the file**

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
}
```

---

## Task 7: Verify Build

- [ ] **Step 1: Run frontend build**

```powershell
cd "E:\web3\web-sport-react-rebuild\frontend"
npm run build
```

Expected: `✓ built in Xs`

If build fails:
- `Cannot find module '../api/matchApi'` → verify `matchApi.js` exports `getMatchDetailFull`
- `useParams is not a function` → confirm react-router-dom is installed
- JSX error in `.js` file → rename to `.jsx`

- [ ] **Step 2: Run backend compile**

```powershell
cd "E:\web3\web-sport-react-rebuild"
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

---

## Summary

### Backend API (unchanged)
- `GET /api/matches/{id}/detail-full` — returns match + stats + events in one call
- Stats shape: `[{ id, teamId, teamName, statName, statValue }]`
- Events shape: `[{ id, teamId, teamName, playerId, playerName, eventTime, eventType, description, scoreAfterEvent }]`

### Files Created
| File | Purpose |
|------|---------|
| `frontend/src/components/Scoreboard.jsx` | Centered scoreboard: teams, score, status, date, venue |
| `frontend/src/components/StatCard.jsx` | Single stat display card |
| `frontend/src/components/TimelineItem.jsx` | Single match event row |

### Files Modified
| File | Change |
|------|--------|
| `frontend/src/api/matchApi.js` | Added `getMatch`, `getMatchStats`, `getMatchEvents`, `getMatchDetailFull` |
| `frontend/src/styles/components.css` | Appended scoreboard, stat card, timeline, detail page CSS |
| `frontend/src/pages/MatchDetailPage.jsx` | Full implementation replacing placeholder |

### How to Test
1. Start backend: `.\mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173/matches`
4. Click any match card → navigates to `/matches/{id}`
5. Verify scoreboard shows teams + score + status badge
6. For FINAL matches: verify stats grid and event timeline render
7. For SCHEDULED matches: verify "경기 시작 전입니다." notice appears
8. Click "← 경기 목록으로" → verify back navigation works

### Next Recommended Step
**Phase 3C: SportsPage** — implement `/sports/:sportType` to show matches filtered by sport type, with sport-specific branding and a featured matches section.
