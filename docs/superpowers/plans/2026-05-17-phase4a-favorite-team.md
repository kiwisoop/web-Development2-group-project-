# Phase 4A: Favorite Team Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing backend favorite team API to the React frontend so users can register/deregister favorite teams from MatchDetailPage and view their favorites on FavoritesPage.

**Architecture:** A new `favoriteApi.js` module wraps the three backend endpoints. `MatchDetailPage` fetches favorite state separately and passes it down to `MatchActionPanel` via props. `FavoritesPage` fetches and renders the user's favorites independently. Auth state comes from the existing `useAuth()` hook — no new auth logic.

**Tech Stack:** React 18, Vite 8, axios (axiosInstance with withCredentials), plain CSS, react-router-dom v7, existing `useAuth` hook

---

## Backend API Reference (verified)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/favorites` | — | `FavoriteTeamResponse[]` |
| POST | `/api/favorites?teamId={id}` | — | `{ success, favorite: FavoriteTeamResponse }` |
| DELETE | `/api/favorites/{favoriteId}` | — | `{ success, favoriteId }` |

**FavoriteTeamResponse shape:**
```js
{
  id: Long,          // favorite record ID — used for DELETE
  teamId: Long,      // the team's ID — used for SET membership check
  teamName: String,
  sportType: String, // "SOCCER" | "BASEBALL" | "ESPORTS"
  team: {
    id, sportType, leagueId, leagueName, teamName, shortName, logoUrl, country
  },
  createdAt: String
}
```

**Error responses:** 4xx with `{ message: String }` in Korean. Backend throws on: not logged in, duplicate, team not found, wrong owner.

**Session auth:** Handled automatically by axios `withCredentials: true` (session cookie). No token needed in headers.

**`useAuth()` returns:** `{ user, loading, isLoggedIn, isAdmin, checkAuth, loginUser, registerUser, logoutUser, error }`
- `isLoggedIn = user?.loggedIn === true` (false during auth loading since `user` starts as `null`)

---

## File Map

| Action | File |
|--------|------|
| Create | `frontend/src/api/favoriteApi.js` |
| Modify | `frontend/src/pages/MatchDetailPage.jsx` |
| Modify | `frontend/src/components/MatchActionPanel.jsx` |
| Modify | `frontend/src/pages/FavoritesPage.jsx` |
| Modify (append) | `frontend/src/styles/components.css` |

---

## Task 1: Create `favoriteApi.js`

**Files:**
- Create: `frontend/src/api/favoriteApi.js`

- [ ] **Step 1: Create the file**

```js
import axiosInstance from './axiosInstance';

export const getFavoriteTeams = (signal) =>
  axiosInstance.get('/favorites', { signal });

export const addFavoriteTeam = (teamId, signal) =>
  axiosInstance.post('/favorites', null, { params: { teamId }, signal });

export const removeFavoriteTeam = (favoriteId, signal) =>
  axiosInstance.delete(`/favorites/${favoriteId}`, { signal });
```

**Notes:**
- `addFavoriteTeam` sends `teamId` as a query param (`?teamId=123`), not in the request body. The `null` body is required so axios doesn't omit `params`.
- `signal` is optional in all three (pass `undefined` if no AbortController needed).

---

## Task 2: Update `MatchDetailPage.jsx`

**Files:**
- Modify: `frontend/src/pages/MatchDetailPage.jsx`

Add favorite state fetching and toggle handler. Pass state down to `MatchActionPanel`.

- [ ] **Step 1: Replace the entire file**

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMatchDetailFull } from '../api/matchApi';
import { getFavoriteTeams, addFavoriteTeam, removeFavoriteTeam } from '../api/favoriteApi';
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
      // non-critical — button re-enables via finally
    } finally {
      setLoadingTeamId(null);
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

**Notes:**
- `favoriteTeamIds` is a `Set<Long>` built fresh on each render from `favoriteTeams`. Used for O(1) membership checks in MatchActionPanel.
- Favorites fetch re-runs whenever `isLoggedIn` changes (auth resolves after page mount). This handles the race between auth loading and page render.
- `handleToggleFavorite` updates local state immediately after API success (no refetch needed).

---

## Task 3: Update `MatchActionPanel.jsx`

**Files:**
- Modify: `frontend/src/components/MatchActionPanel.jsx`

Replace the static placeholder with real toggle buttons that respond to auth and favorite state.

- [ ] **Step 1: Replace the entire file**

```jsx
export default function MatchActionPanel({ match, isLoggedIn, favoriteTeamIds, onToggleFavorite, loadingTeamId }) {
  const homeTeamId = match.homeTeam?.id;
  const awayTeamId = match.awayTeam?.id;
  const homeIsFav = favoriteTeamIds?.has(homeTeamId);
  const awayIsFav = favoriteTeamIds?.has(awayTeamId);

  return (
    <div className="detail-section">
      <h2 className="detail-section-title">관심 팀</h2>
      <div className="action-panel card">
        <div className="action-row">
          <span className="action-team-name">{match.homeTeam?.teamName || '홈팀'}</span>
          {isLoggedIn ? (
            <button
              className={`btn ${homeIsFav ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => onToggleFavorite(homeTeamId)}
              disabled={loadingTeamId === homeTeamId || !homeTeamId}
            >
              {loadingTeamId === homeTeamId ? '처리 중...' : homeIsFav ? '관심 팀 해제' : '관심 팀 등록'}
            </button>
          ) : (
            <button className="btn btn-outline" disabled>관심 팀 등록</button>
          )}
        </div>
        <div className="action-row">
          <span className="action-team-name">{match.awayTeam?.teamName || '원정팀'}</span>
          {isLoggedIn ? (
            <button
              className={`btn ${awayIsFav ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => onToggleFavorite(awayTeamId)}
              disabled={loadingTeamId === awayTeamId || !awayTeamId}
            >
              {loadingTeamId === awayTeamId ? '처리 중...' : awayIsFav ? '관심 팀 해제' : '관심 팀 등록'}
            </button>
          ) : (
            <button className="btn btn-outline" disabled>관심 팀 등록</button>
          )}
        </div>
        {!isLoggedIn && (
          <p className="notice-text">로그인 후 관심 팀을 등록할 수 있습니다.</p>
        )}
      </div>
    </div>
  );
}
```

**Notes:**
- `homeTeamId` comes from `match.homeTeam?.id` — the team's database ID.
- `favoriteTeamIds.has(homeTeamId)` checks if the team is already favorited.
- Button is disabled while `loadingTeamId === teamId` (API call in flight) or if `teamId` is null/undefined.
- `btn-danger` class is added in Task 5.

---

## Task 4: Implement `FavoritesPage.jsx`

**Files:**
- Modify: `frontend/src/pages/FavoritesPage.jsx`

Replace the one-liner placeholder with a real page.

- [ ] **Step 1: Replace the entire file**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFavoriteTeams, removeFavoriteTeam } from '../api/favoriteApi';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';

const SPORT_LABELS = {
  SOCCER: '⚽ 축구',
  BASEBALL: '⚾ 야구',
  ESPORTS: '🎮 E스포츠',
};

export default function FavoritesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getFavoriteTeams(controller.signal)
      .then((res) => setFavorites(res.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('관심 팀 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [isLoggedIn, authLoading]);

  const handleRemove = async (favoriteId) => {
    setRemovingId(favoriteId);
    try {
      await removeFavoriteTeam(favoriteId);
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch {
      // silently fail — retry by refreshing page
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || loading) return <LoadingState />;

  if (!isLoggedIn) {
    return (
      <div className="favorites-page">
        <h1 className="page-title">관심 팀</h1>
        <div className="login-notice card">
          <p>로그인 후 관심 팀을 확인할 수 있습니다.</p>
          <Link to="/login" className="btn btn-primary">로그인하기</Link>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="favorites-page">
      <h1 className="page-title">관심 팀</h1>
      <ErrorBox message={error} />
    </div>
  );

  return (
    <div className="favorites-page">
      <h1 className="page-title">관심 팀</h1>
      {favorites.length === 0 ? (
        <EmptyState
          title="관심 팀이 없습니다"
          description="경기 상세 페이지에서 팀을 관심 팀으로 등록해 보세요."
        />
      ) : (
        <div className="favorite-grid">
          {favorites.map((fav) => (
            <div key={fav.id} className="favorite-card card">
              <div className="favorite-card-header">
                <span className="favorite-sport-label">
                  {SPORT_LABELS[fav.sportType] || fav.sportType}
                </span>
              </div>
              <p className="favorite-team-name">{fav.teamName}</p>
              {fav.team?.leagueName && (
                <p className="favorite-league-name">{fav.team.leagueName}</p>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleRemove(fav.id)}
                disabled={removingId === fav.id}
              >
                {removingId === fav.id ? '처리 중...' : '관심 팀 해제'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Notes:**
- `authLoading` gates the effect so it doesn't fire with stale `isLoggedIn = false` during auth init.
- Remove updates local state immediately (filter) — no refetch needed.
- `removingId` tracks which card's button is in flight to show "처리 중..." and prevent double-clicks.
- Recommended matches section is **skipped** — backend does not expose `/api/favorites/recommended-matches`.

---

## Task 5: Append CSS to `components.css`

**Files:**
- Modify (append only): `frontend/src/styles/components.css`

Do NOT replace the file. Append the following block to the very end.

- [ ] **Step 1: Append CSS**

```css
/* ===== Danger button ===== */
.btn-danger {
  background: #ef4444;
  color: #fff;
  border: 2px solid #ef4444;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

/* ===== Small button ===== */
.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
}

/* ===== Favorites Page ===== */
.favorites-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.login-notice {
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* ===== Favorite grid ===== */
.favorite-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 900px) {
  .favorite-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .favorite-grid { grid-template-columns: 1fr; }
}

/* ===== Favorite card ===== */
.favorite-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.favorite-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.favorite-sport-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary);
}

.favorite-team-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}

.favorite-league-name {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
```

---

## Task 6: Verify Builds

**Files:** none

- [ ] **Step 1: Run frontend build**

```powershell
cd "E:\web3\web-sport-react-rebuild\frontend"
npm run build
```

Expected: `✓ built in Xs` with no errors.

Common failures:
- `Cannot find module '../api/favoriteApi'` → verify `src/api/favoriteApi.js` exists
- `Cannot find module '../hooks/useAuth'` → verify import path (`.jsx` extension, casing)
- JSX syntax error → ensure file extension is `.jsx` not `.js`
- `useNavigate is not imported` → check MatchDetailPage imports

- [ ] **Step 2: Run backend compile**

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
| `frontend/src/api/favoriteApi.js` | Three API functions: get list, add by teamId, remove by favoriteId |

### Files Modified
| File | Change |
|------|--------|
| `frontend/src/pages/MatchDetailPage.jsx` | Added favorite state fetch + toggle handler; passes 5 props to MatchActionPanel |
| `frontend/src/components/MatchActionPanel.jsx` | Real toggle buttons (auth-aware, favorite-state-aware, loading-aware) |
| `frontend/src/pages/FavoritesPage.jsx` | Full implementation: auth gate, fetch, card grid, remove |
| `frontend/src/styles/components.css` | Appended `.btn-danger`, `.btn-sm`, favorites page/grid/card styles |

### What works after this phase
- Logged-out users: favorite buttons are disabled with login notice; FavoritesPage shows login CTA
- Logged-in users: can toggle favorite on home/away team from MatchDetailPage; can view and remove favorites on FavoritesPage
- Optimistic local state updates — no refetch needed after toggle or remove

### What was intentionally NOT implemented
- Recommended matches section — backend does not expose `/api/favorites/recommended-matches`
- Inline error toasts on toggle failure (silently re-enables button)
- Gemini analysis, prediction vote, chat (future phases)

### How to Test
1. Start backend: `.\mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Log in at `http://localhost:5173/login`
4. Open any match detail — buttons should show "관심 팀 등록" (active, not disabled)
5. Click button — should switch to "관심 팀 해제" and persist on page reload
6. Navigate to `http://localhost:5173/favorites` — registered teams should appear
7. Click "관심 팀 해제" on FavoritesPage — card disappears immediately
8. Log out — buttons revert to disabled with login notice

### Next Recommended Step
**Phase 4B: Implement fan prediction vote** — wire `PredictionPreview` to `POST /api/predictions` with auth gate, showing vote counts and user's current vote with highlight.
