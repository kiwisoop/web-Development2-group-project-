# Phase 3A: MatchListPage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the MatchListPage placeholder with a fully functional match list connected to `GET /api/matches`, including filter UI, pagination, match cards, and status badges.

**Architecture:** Filters are stored in URL search params (via `useSearchParams`) so the page is bookmarkable and shareable. Changing filters updates the URL, which triggers a `useEffect` to refetch. The `MatchCard` and `StatusBadge` are separate focused components. No new backend changes required.

**Tech Stack:** React 18, react-router-dom v7 (`useSearchParams`), axios, plain CSS

---

## Backend API — Already Exists, No Changes Needed

**Endpoint:** `GET /api/matches`

**Returns** `PageResponse<MatchResponse>` — no `ApiResponse` wrapper:
```json
{
  "content": [ { ...match }, ... ],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3,
  "hasNext": true,
  "hasPrevious": false
}
```

**Each match object:**
```json
{
  "id": 1,
  "sportType": "SOCCER",
  "status": "LIVE",
  "season": "2025-26",
  "matchDate": "2026-05-17T15:00:00",
  "venue": "Wembley Stadium",
  "homeScore": 2,
  "awayScore": 1,
  "league": { "id": 1, "leagueName": "Premier League", "sportType": "SOCCER", "season": "2025-26", "country": "England" },
  "homeTeam": { "id": 1, "teamName": "Manchester City", "shortName": "MCI", "logoUrl": null, "sportType": "SOCCER", "country": "England", "leagueId": 1, "leagueName": "Premier League" },
  "awayTeam": { ... }
}
```

**Accepted query params:**
- `sportType` — `SOCCER` | `BASEBALL` | `ESPORTS`
- `status` — `SCHEDULED` | `LIVE` | `FINAL`
- `keyword` — string
- `year` — integer
- `month` — integer (1-12)
- `page` — integer (default 0)
- `size` — integer (default 20, max 100)
- `sort` — `latest` | `oldest` | `liveFirst` (default `latest`)

---

## File Map

| Action | File |
|--------|------|
| Create | `frontend/src/api/matchApi.js` |
| Create | `frontend/src/components/StatusBadge.jsx` |
| Create | `frontend/src/components/MatchCard.jsx` |
| Modify (append) | `frontend/src/styles/components.css` |
| Overwrite | `frontend/src/pages/MatchListPage.jsx` |

---

## Task 1: Create `matchApi.js`

**File:**
- Create: `frontend/src/api/matchApi.js`

- [ ] **Step 1: Create the file**

```js
import axiosInstance from './axiosInstance';

export const getMatches = (params) => axiosInstance.get('/matches', { params });
```

`axiosInstance` already exists at `./axiosInstance` with `baseURL: 'http://localhost:8080/api'` and `withCredentials: true`. Passing `params` as axios config sends them as query string parameters.

---

## Task 2: Create `StatusBadge.jsx`

**File:**
- Create: `frontend/src/components/StatusBadge.jsx`

- [ ] **Step 1: Create the file**

```jsx
const STATUS_MAP = {
  SCHEDULED: { label: '예정', className: 'badge-scheduled' },
  LIVE: { label: 'LIVE', className: 'badge-live' },
  FINAL: { label: '종료', className: 'badge-final' },
  CANCELLED: { label: '취소', className: 'badge-cancelled' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: status ?? '알 수 없음', className: 'badge-default' };
  return <span className={`status-badge ${config.className}`}>{config.label}</span>;
}
```

---

## Task 3: Create `MatchCard.jsx`

**File:**
- Create: `frontend/src/components/MatchCard.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useNavigate } from 'react-router-dom';
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

export default function MatchCard({ match }) {
  const navigate = useNavigate();
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;

  return (
    <div className="match-card card" onClick={() => navigate(`/matches/${match.id}`)}>
      <div className="match-card-header">
        <span className="sport-tag">{SPORT_LABELS[match.sportType] || match.sportType}</span>
        <StatusBadge status={match.status} />
      </div>

      {match.league && (
        <p className="match-league">{match.league.leagueName}</p>
      )}

      <div className="match-teams">
        <div className="team home-team">
          <span className="team-name">{match.homeTeam?.teamName || '홈팀'}</span>
          {hasScore && <span className="score">{match.homeScore}</span>}
        </div>
        <div className="match-vs">VS</div>
        <div className="team away-team">
          {hasScore && <span className="score">{match.awayScore}</span>}
          <span className="team-name">{match.awayTeam?.teamName || '원정팀'}</span>
        </div>
      </div>

      <div className="match-meta">
        {match.matchDate && <span className="match-date">{formatDate(match.matchDate)}</span>}
        {match.venue && <span className="match-venue">📍 {match.venue}</span>}
      </div>
    </div>
  );
}
```

---

## Task 4: Append Match-Related CSS to `components.css`

**File:**
- Modify (append only): `frontend/src/styles/components.css`

Do NOT replace the file. Append the following block to the end of the existing file.

- [ ] **Step 1: Append CSS to the end of `frontend/src/styles/components.css`**

```css
/* ===== Status Badge ===== */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.badge-scheduled {
  background: #e0e7ff;
  color: #3730a3;
}

.badge-live {
  background: #fee2e2;
  color: #dc2626;
  animation: badgePulse 1.5s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

.badge-final {
  background: #f1f5f9;
  color: #64748b;
}

.badge-cancelled {
  background: #fef3c7;
  color: #92400e;
}

.badge-default {
  background: #f1f5f9;
  color: var(--color-text-muted);
}

/* ===== Match Card ===== */
.match-card {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  padding: 1.25rem;
}

.match-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.match-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.sport-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.match-league {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.home-team { justify-content: flex-start; }
.away-team { justify-content: flex-end; }

.team-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.match-vs {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.score {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-primary);
  flex-shrink: 0;
}

.match-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ===== Match List Page ===== */
.match-list-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-head { margin-bottom: 0.5rem; }

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
}

.page-desc {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Filter bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 110px;
}

.filter-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.filter-group select,
.filter-group input[type="text"],
.filter-group input[type="number"] {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  transition: border-color 0.15s;
}

.filter-group select:focus,
.filter-group input:focus {
  border-color: var(--color-primary);
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  padding-bottom: 1px;
}

/* Match grid */
.match-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

@media (max-width: 1024px) {
  .match-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .match-grid { grid-template-columns: 1fr; }
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.page-info {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}
```

---

## Task 5: Implement `MatchListPage.jsx`

**File:**
- Overwrite: `frontend/src/pages/MatchListPage.jsx`

- [ ] **Step 1: Overwrite the file**

```jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMatches } from '../api/matchApi';
import MatchCard from '../components/MatchCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';

function paramsToFilters(searchParams) {
  return {
    sportType: searchParams.get('sportType') || '',
    status: searchParams.get('status') || '',
    keyword: searchParams.get('keyword') || '',
    year: searchParams.get('year') || '',
    month: searchParams.get('month') || '',
    sort: searchParams.get('sort') || 'latest',
    page: parseInt(searchParams.get('page') || '0', 10),
    size: parseInt(searchParams.get('size') || '20', 10),
  };
}

function buildQueryObject(filters) {
  const obj = {};
  if (filters.sportType) obj.sportType = filters.sportType;
  if (filters.status) obj.status = filters.status;
  if (filters.keyword) obj.keyword = filters.keyword;
  if (filters.year) obj.year = filters.year;
  if (filters.month) obj.month = filters.month;
  if (filters.sort && filters.sort !== 'latest') obj.sort = filters.sort;
  if (filters.page > 0) obj.page = filters.page;
  if (filters.size && filters.size !== 20) obj.size = filters.size;
  return obj;
}

export default function MatchListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState(() => paramsToFilters(searchParams));
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const filters = paramsToFilters(searchParams);
    setForm(filters);

    const params = {};
    if (filters.sportType) params.sportType = filters.sportType;
    if (filters.status) params.status = filters.status;
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.year) params.year = filters.year;
    if (filters.month) params.month = filters.month;
    if (filters.sort) params.sort = filters.sort;
    params.page = filters.page;
    params.size = filters.size;

    setLoading(true);
    setError(null);
    getMatches(params)
      .then((res) => {
        const data = res.data;
        setMatches(data.content || []);
        setPagination({
          page: data.page,
          size: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
          hasNext: data.hasNext,
          hasPrevious: data.hasPrevious,
        });
      })
      .catch(() => {
        setError('경기 목록을 불러오지 못했습니다.');
        setMatches([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(buildQueryObject({ ...form, page: 0 }));
  };

  const handleReset = () => {
    setForm({ sportType: '', status: '', keyword: '', year: '', month: '', sort: 'latest', page: 0, size: 20 });
    setSearchParams({});
  };

  const handlePage = (newPage) => {
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page: newPage });
  };

  const currentPage = pagination?.page ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="match-list-page">
      <div className="page-head">
        <h1 className="page-title">경기 목록</h1>
        <p className="page-desc">종목, 상태, 키워드로 경기를 빠르게 찾아보세요.</p>
      </div>

      <form className="filter-bar card" onSubmit={handleSearch}>
        <div className="filter-group">
          <label>종목</label>
          <select name="sportType" value={form.sportType} onChange={handleChange}>
            <option value="">전체</option>
            <option value="SOCCER">⚽ 축구</option>
            <option value="BASEBALL">⚾ 야구</option>
            <option value="ESPORTS">🎮 E스포츠</option>
          </select>
        </div>

        <div className="filter-group">
          <label>상태</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="">전체</option>
            <option value="SCHEDULED">예정</option>
            <option value="LIVE">진행 중</option>
            <option value="FINAL">종료</option>
          </select>
        </div>

        <div className="filter-group">
          <label>키워드</label>
          <input
            name="keyword"
            type="text"
            value={form.keyword}
            onChange={handleChange}
            placeholder="팀명, 리그명..."
          />
        </div>

        <div className="filter-group">
          <label>연도</label>
          <input
            name="year"
            type="number"
            value={form.year}
            onChange={handleChange}
            placeholder="2026"
            min="1900"
            max="2100"
          />
        </div>

        <div className="filter-group">
          <label>월</label>
          <input
            name="month"
            type="number"
            value={form.month}
            onChange={handleChange}
            placeholder="5"
            min="1"
            max="12"
          />
        </div>

        <div className="filter-group">
          <label>정렬</label>
          <select name="sort" value={form.sort} onChange={handleChange}>
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="liveFirst">LIVE 먼저</option>
          </select>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">검색</button>
          <button type="button" className="btn btn-outline" onClick={handleReset}>초기화</button>
        </div>
      </form>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <LoadingState />
      ) : matches.length === 0 ? (
        <EmptyState title="경기가 없습니다" description="다른 조건으로 검색해 보세요." />
      ) : (
        <>
          <div className="match-grid">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={!pagination?.hasPrevious}
                onClick={() => handlePage(currentPage - 1)}
              >
                이전
              </button>
              <span className="page-info">{currentPage + 1} / {totalPages}</span>
              <button
                className="btn btn-outline"
                disabled={!pagination?.hasNext}
                onClick={() => handlePage(currentPage + 1)}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

## Task 6: Verify Build

- [ ] **Step 1: Run frontend build**

```powershell
cd "E:\web3\web-sport-react-rebuild\frontend"
npm run build
```

Expected: `✓ built in Xs`

If build fails:
- `Cannot find module '../api/matchApi'` → check file exists at `src/api/matchApi.js`
- `useSearchParams is not a function` → confirm react-router-dom is installed (`package.json` should list it)
- Any JSX error in `.js` file → rename to `.jsx`

- [ ] **Step 2: Run backend compile**

```powershell
cd "E:\web3\web-sport-react-rebuild"
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

---

## Summary

### Backend API (unchanged)
- `GET /api/matches` — accepts `sportType, status, keyword, year, month, sort, page, size`
- Returns `{ content: [...], page, size, totalElements, totalPages, hasNext, hasPrevious }`
- `sort` values: `latest`, `oldest`, `liveFirst`

### Files Created
| File | Purpose |
|------|---------|
| `frontend/src/api/matchApi.js` | `getMatches(params)` via axios |
| `frontend/src/components/StatusBadge.jsx` | Colored badge for SCHEDULED/LIVE/FINAL/CANCELLED |
| `frontend/src/components/MatchCard.jsx` | Clickable card showing match details |

### Files Modified
| File | Change |
|------|--------|
| `frontend/src/styles/components.css` | Appended status badge + match card + filter bar + grid + pagination styles |
| `frontend/src/pages/MatchListPage.jsx` | Full implementation replacing placeholder |

### How to Test
1. Start backend: `.\mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:5173/matches`
4. Verify match cards load from API
5. Change sport type filter → click 검색 → URL updates → list re-filters
6. Click 초기화 → filters cleared
7. If there are >20 matches, pagination buttons appear

### Next Recommended Step
**Phase 3B: Implement MatchDetailPage** — connect `GET /api/matches/{id}/detail-full` to show full match stats, events, analysis panel, and favorite team toggle.
