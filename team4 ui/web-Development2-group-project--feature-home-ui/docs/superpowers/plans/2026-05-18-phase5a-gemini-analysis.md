# Phase 5A: Gemini Match Result Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the existing backend Gemini match result analysis API to the React MatchDetailPage, replacing the AiAnalysisPreview placeholder with real analysis display and generate/regenerate actions.

**Architecture:** `MatchDetailPage` seeds `analysis` state from the `detail-full` response on load, then updates it after user-triggered generate/regenerate calls. State flows down as props through `AiAnalysisPreview` to a new `AiAnalysisCard` component. `AiAnalysisPreview` keeps Card 2 (pre-match prediction) as a static placeholder. No polling — generation is synchronous (blocks up to 45 s).

**Tech Stack:** React 18, Vite 8, axios (axiosInstance), plain CSS, JavaScript only

---

## Backend API Reference (verified)

| Method | Path | Blocks? | Response |
|--------|------|---------|----------|
| GET | `/api/matches/{matchId}/analysis` | No | `AnalysisResponse` |
| POST | `/api/matches/{matchId}/analysis/generate` | Yes (≤45 s) | `AnalysisResponse` |
| POST | `/api/matches/{matchId}/analysis/regenerate` | Yes (≤45 s) | `AnalysisResponse` |

**`AnalysisResponse` shape:**
```js
{
  id: Long,                    // null if NOT_CREATED
  provider: "GEMINI" | "MOCK",
  status: "NOT_CREATED" | "GENERATING" | "DONE" | "FAILED",
  summaryText: String,         // null unless DONE
  tacticalAnalysis: String,    // null unless DONE
  keyPoint: String,            // null unless DONE
  errorMessage: String,        // null unless FAILED
  updatedAt: String            // ISO 8601, null if NOT_CREATED
}
```

**`GET /api/matches/{matchId}/detail-full`** already returns `analysis: AnalysisResponse` and `analysisStatus: String`. The `analysis` field seeds the initial state — no separate fetch needed on page load.

**Generation is synchronous:** POST endpoints block until Gemini responds or times out at 45 s. If `GEMINI_API_KEY` is missing the backend returns `status: FAILED` with `errorMessage` in Korean.

**Match status gate:** Only `FINAL` matches can generate analysis. The backend enforces this, but the frontend also disables the button when `match.status !== 'FINAL'` and shows the message "경기 결과 분석은 경기 종료 후 사용할 수 있습니다."

---

## File Map

| Action | File |
|--------|------|
| Create | `frontend/src/api/analysisApi.js` |
| Create | `frontend/src/components/AiAnalysisCard.jsx` |
| Modify | `frontend/src/components/AiAnalysisPreview.jsx` |
| Modify | `frontend/src/pages/MatchDetailPage.jsx` |
| Modify (append) | `frontend/src/styles/components.css` |

---

## Task 1: Create `analysisApi.js`

**Files:**
- Create: `frontend/src/api/analysisApi.js`

- [ ] **Step 1: Create the file**

```js
import axiosInstance from './axiosInstance';

export const getMatchAnalysis = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/analysis`, { signal });

export const generateMatchAnalysis = (matchId) =>
  axiosInstance.post(`/matches/${matchId}/analysis/generate`);

export const regenerateMatchAnalysis = (matchId) =>
  axiosInstance.post(`/matches/${matchId}/analysis/regenerate`);
```

**Notes:**
- `generate` and `regenerate` are user-triggered — no signal needed (no benefit to aborting a synchronous backend call mid-flight).
- `getMatchAnalysis` has signal support for completeness, though it is not called on page load (the `detail-full` response seeds initial state).

---

## Task 2: Create `AiAnalysisCard.jsx`

**Files:**
- Create: `frontend/src/components/AiAnalysisCard.jsx`

This is a pure presentational component — no imports, no hooks, no API calls.

- [ ] **Step 1: Create the file**

```jsx
function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AiAnalysisCard({ matchStatus, analysis, onGenerate, onRegenerate, generating }) {
  const status = analysis?.status || 'NOT_CREATED';
  const isFinal = matchStatus === 'FINAL';

  if (generating) {
    return (
      <div className="analysis-card card">
        <h3 className="preview-card-title">경기 결과 분석</h3>
        <div className="analysis-loading">
          Gemini가 분석 중입니다... (최대 45초 소요)
        </div>
      </div>
    );
  }

  if (status === 'DONE') {
    return (
      <div className="analysis-card card">
        <h3 className="preview-card-title">경기 결과 분석</h3>
        <span className="analysis-status-badge badge-done">분석 완료</span>
        {analysis.summaryText && (
          <div className="analysis-content-block">
            <strong>요약</strong>
            <p>{analysis.summaryText}</p>
          </div>
        )}
        {analysis.tacticalAnalysis && (
          <div className="analysis-content-block">
            <strong>전술 분석</strong>
            <p>{analysis.tacticalAnalysis}</p>
          </div>
        )}
        {analysis.keyPoint && (
          <div className="analysis-content-block">
            <strong>핵심 포인트</strong>
            <p>{analysis.keyPoint}</p>
          </div>
        )}
        {analysis.updatedAt && (
          <p className="analysis-meta">{formatDate(analysis.updatedAt)}</p>
        )}
        <div className="analysis-actions">
          <button className="btn btn-outline" onClick={onRegenerate} disabled={generating}>
            AI 분석 재생성
          </button>
        </div>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="analysis-card card">
        <h3 className="preview-card-title">경기 결과 분석</h3>
        <span className="analysis-status-badge badge-failed">분석 실패</span>
        {analysis.errorMessage && (
          <div className="analysis-error">{analysis.errorMessage}</div>
        )}
        <div className="analysis-actions">
          <button className="btn btn-outline" onClick={onGenerate} disabled={generating}>
            다시 생성
          </button>
        </div>
      </div>
    );
  }

  // NOT_CREATED (status is null or 'NOT_CREATED')
  if (!isFinal) {
    return (
      <div className="analysis-card card">
        <h3 className="preview-card-title">경기 결과 분석</h3>
        <p className="analysis-placeholder">경기 결과 분석은 경기 종료 후 사용할 수 있습니다.</p>
        <button className="btn btn-outline" disabled>AI 분석 생성</button>
      </div>
    );
  }

  return (
    <div className="analysis-card card">
      <h3 className="preview-card-title">경기 결과 분석</h3>
      <p className="analysis-placeholder">이 경기에 대한 AI 분석이 아직 생성되지 않았습니다.</p>
      <div className="analysis-actions">
        <button className="btn btn-primary" onClick={onGenerate} disabled={generating}>
          AI 분석 생성
        </button>
      </div>
    </div>
  );
}
```

**Props:**
- `matchStatus` — `"SCHEDULED" | "LIVE" | "FINAL" | "CANCELLED"`. Only `"FINAL"` enables generation.
- `analysis` — `AnalysisResponse` object or `null`. `null` treated same as `NOT_CREATED`.
- `onGenerate` — callback for generate button
- `onRegenerate` — callback for regenerate button
- `generating` — boolean, true while API call is in flight

**Status flow:**
1. `generating === true` → loading view (shown first, before status check)
2. `status === 'DONE'` → full analysis display + regenerate button
3. `status === 'FAILED'` → error message + retry button
4. `status === 'NOT_CREATED'` + not FINAL → disabled button + notice
5. `status === 'NOT_CREATED'` + FINAL → active generate button

---

## Task 3: Update `AiAnalysisPreview.jsx`

**Files:**
- Modify: `frontend/src/components/AiAnalysisPreview.jsx`

Replace entirely. Now accepts props and delegates Card 1 to `AiAnalysisCard`. Card 2 remains static.

- [ ] **Step 1: Replace the entire file**

```jsx
import AiAnalysisCard from './AiAnalysisCard';

export default function AiAnalysisPreview({ matchStatus, analysis, onGenerate, onRegenerate, generating }) {
  return (
    <div className="detail-section">
      <h2 className="detail-section-title">AI 경기 분석</h2>
      <div className="preview-grid">
        <AiAnalysisCard
          matchStatus={matchStatus}
          analysis={analysis}
          onGenerate={onGenerate}
          onRegenerate={onRegenerate}
          generating={generating}
        />
        <div className="preview-card card">
          <h3 className="preview-card-title">경기 전 승패 전망</h3>
          <p className="preview-card-desc">
            경기 전 승패 전망은 다음 단계에서 구현 예정입니다. 승률은 Gemini가 임의로 만들지 않고, 백엔드가 계산한 지표를 바탕으로 설명만 생성합니다.
          </p>
          <button className="btn btn-outline" disabled>승패 전망 준비 중</button>
        </div>
      </div>
    </div>
  );
}
```

**Note:** `AiAnalysisCard` does not receive `matchId` — it does not make API calls itself. All API calls are in `MatchDetailPage`.

---

## Task 4: Update `MatchDetailPage.jsx`

**Files:**
- Modify: `frontend/src/pages/MatchDetailPage.jsx`

Add analysis state, seed from `detail-full`, add generate/regenerate handlers, pass props to `AiAnalysisPreview`.

- [ ] **Step 1: Replace the entire file**

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMatchDetailFull } from '../api/matchApi';
import { getFavoriteTeams, addFavoriteTeam, removeFavoriteTeam } from '../api/favoriteApi';
import { generateMatchAnalysis, regenerateMatchAnalysis } from '../api/analysisApi';
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

**Key changes from previous version:**
- Added `generateMatchAnalysis, regenerateMatchAnalysis` import
- Added `analysis`, `analysisGenerating`, `analysisError` state
- `getMatchDetailFull .then()` now also calls `setAnalysis(res.data.analysis)`
- Added `handleGenerate` and `handleRegenerate` functions
- Added `{analysisError && <ErrorBox message={analysisError} />}` above AiAnalysisPreview
- `AiAnalysisPreview` now receives 5 props instead of none

---

## Task 5: Append CSS to `components.css`

**Files:**
- Modify (append only): `frontend/src/styles/components.css`

Do NOT replace the file. Append to the very end.

- [ ] **Step 1: Append CSS**

```css
/* ===== Analysis Card ===== */
.analysis-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ===== Analysis status badges ===== */
.analysis-status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  width: fit-content;
}

.badge-done {
  background: #dcfce7;
  color: #15803d;
}

.badge-failed {
  background: #fee2e2;
  color: #b91c1c;
}

/* ===== Analysis content blocks ===== */
.analysis-content-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--color-bg);
  border-radius: var(--radius);
  font-size: 0.875rem;
  line-height: 1.6;
}

.analysis-content-block strong {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.analysis-content-block p {
  color: var(--color-text);
  margin: 0;
}

/* ===== Analysis meta (timestamp) ===== */
.analysis-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ===== Analysis actions ===== */
.analysis-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

/* ===== Analysis error ===== */
.analysis-error {
  padding: 0.75rem;
  background: #fee2e2;
  border-radius: var(--radius);
  color: #b91c1c;
  font-size: 0.85rem;
  line-height: 1.5;
}

/* ===== Analysis loading ===== */
.analysis-loading {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ===== Analysis placeholder ===== */
.analysis-placeholder {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
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

Common failures and fixes:
- `Cannot find module '../api/analysisApi'` → verify `src/api/analysisApi.js` exists
- `Cannot find module './AiAnalysisCard'` → verify `src/components/AiAnalysisCard.jsx` exists (`.jsx` extension required)
- `AiAnalysisPreview` props warning → check that all 5 props are passed from MatchDetailPage

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
| `frontend/src/api/analysisApi.js` | `getMatchAnalysis`, `generateMatchAnalysis`, `regenerateMatchAnalysis` |
| `frontend/src/components/AiAnalysisCard.jsx` | Displays analysis by status: NOT_CREATED / DONE / FAILED / loading |

### Files Modified
| File | Change |
|------|--------|
| `frontend/src/components/AiAnalysisPreview.jsx` | Now accepts props; delegates Card 1 to AiAnalysisCard; Card 2 stays placeholder |
| `frontend/src/pages/MatchDetailPage.jsx` | Added analysis state + handlers; seeds from detail-full; passes to AiAnalysisPreview |
| `frontend/src/styles/components.css` | Appended analysis card, status badge, content block, error, loading, placeholder styles |

### What works after this phase
- FINAL matches: "AI 분석 생성" button is active; clicking generates analysis (Gemini, up to 45 s wait)
- After generation: `summaryText`, `tacticalAnalysis`, `keyPoint` displayed; "AI 분석 재생성" available
- FAILED state: Korean error message displayed (covers missing API key case); "다시 생성" button
- Non-FINAL matches: button disabled with Korean notice
- Pre-match prediction card: static placeholder with updated text

### What was intentionally NOT implemented
- Pre-match win probability prediction (Phase 5B)
- Async/polling for analysis (not needed — backend is synchronous)
- Admin-only analysis endpoints
- `GET /api/matches/{matchId}/analysis` on separate page load (seeded from `detail-full`)

### How to Test
1. Start backend: `.\mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Open a FINAL match: `http://localhost:5173/matches/{id}`
4. Confirm "AI 분석 생성" button is active
5. Click button → loading state shows for up to 45 s → analysis appears
6. Click "AI 분석 재생성" → same flow, overwrites previous
7. Open a non-FINAL match → button should be disabled with notice
8. If `GEMINI_API_KEY` is not set → FAILED state with Korean error message

### Next Recommended Step
**Phase 5B: Pre-match win prediction** — wire the pre-match outlook card to `POST /api/matches/{matchId}/analysis/prediction` once the backend has enough statistical data and a separate prediction endpoint.
