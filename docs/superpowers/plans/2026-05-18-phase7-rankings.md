# Phase 7: Sport Rankings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement team rankings for SOCCER, BASEBALL, and ESPORTS based on FINAL match results, accessible at `/rankings/soccer`, `/rankings/baseball`, `/rankings/esports`.

**Architecture:** New `ranking` package on the backend (DTO + service + controller). The service loads teams and FINAL matches by sport type, accumulates stats in Java, sorts with sport-specific rules, then assigns ranks. The frontend has a new `RankingsPage` with sport tabs, a `RankingTable` component, a new `/rankings/:sportType` route, and a Header nav link.

**Tech Stack:** Spring Boot 3, JPA (Jakarta), Lombok, Oracle DB, React 18, Vite 8, axios, plain CSS

---

## Existing Patterns (follow exactly)

### Java
- Entity: `@Entity @Table @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`
- Repository: `extends JpaRepository<Entity, Long>`, `@Query` with JPQL, `@Param`
- Service: `@Service @RequiredArgsConstructor`, `@Transactional(readOnly = true)`
- Controller: `@RestController @RequestMapping @RequiredArgsConstructor`, `ApiResponse.ok(data)`
- Errors: `throw new BusinessException("message")`
- Imports: `jakarta.persistence.*`, `com.sport.web_sport.common.error.BusinessException`, `com.sport.web_sport.common.response.ApiResponse`
- `MatchStatus` enum values: `SCHEDULED, PRE_GAME, LIVE, FINAL, CANCELED` (single L)
- `SportType` enum values: `SOCCER, BASEBALL, ESPORTS`

### Frontend
- API modules: thin axios wrappers in `frontend/src/api/`
- `ApiResponse` unwrap: `res.data.data` (body is `{ success, message, data }`)
- AbortController pattern in `useEffect`
- JavaScript only, no TypeScript, no Tailwind

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/main/java/com/sport/web_sport/sports/repository/MatchRepository.java` |
| Create | `src/main/java/com/sport/web_sport/ranking/dto/RankingTeamResponse.java` |
| Create | `src/main/java/com/sport/web_sport/ranking/service/RankingService.java` |
| Create | `src/main/java/com/sport/web_sport/ranking/controller/RankingController.java` |
| Create | `frontend/src/api/rankingApi.js` |
| Create | `frontend/src/components/RankingTable.jsx` |
| Create | `frontend/src/pages/RankingsPage.jsx` |
| Modify | `frontend/src/router/AppRouter.jsx` |
| Modify | `frontend/src/components/Header.jsx` |
| Modify (append) | `frontend/src/styles/components.css` |

---

## Task 1: Add JPQL Query to MatchRepository

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/repository/MatchRepository.java`

The service needs to load all FINAL matches for a sport type with homeTeam, awayTeam, and league eagerly fetched (to avoid N+1 in ranking calculation). The existing repository has no such method.

- [ ] **Step 1: Add `findBySportTypeAndStatusWithTeams` to MatchRepository**

Append the following method inside the existing `MatchRepository` interface, after the last existing method:

```java
@Query("""
        select m from Match m
        join fetch m.homeTeam
        join fetch m.awayTeam
        left join fetch m.league
        where m.sportType = :sportType
          and m.status = :status
        """)
List<Match> findBySportTypeAndStatusWithTeams(@Param("sportType") SportType sportType,
                                              @Param("status") MatchStatus status);
```

The file already imports `SportType`, `MatchStatus`, `@Query`, `@Param`, and `List` — no new imports needed.

- [ ] **Step 2: Verify backend compiles**

```powershell
cd "E:\web3\web-sport-react-rebuild"
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

---

## Task 2: RankingTeamResponse DTO

**Files:**
- Create: `src/main/java/com/sport/web_sport/ranking/dto/RankingTeamResponse.java`

- [ ] **Step 1: Create the file**

```java
package com.sport.web_sport.ranking.dto;

import com.sport.web_sport.common.type.SportType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
public class RankingTeamResponse {
    private int rank;
    private Long teamId;
    private String teamName;
    private SportType sportType;
    private String leagueName;
    private int gamesPlayed;
    private int wins;
    private int draws;
    private int losses;
    private double winRate;
    private int points;
    private int scoresFor;
    private int scoresAgainst;
    private int scoreDifference;
}
```

**Notes:**
- `@Builder(toBuilder = true)` enables `existing.toBuilder().rank(n).build()` — used to assign rank after sorting without repeating all fields.
- `leagueName` is nullable (some teams may have no league).
- `points` is 0 for BASEBALL/ESPORTS (not used in sorting, but frontend can show "-").
- `winRate` is a double (e.g., 66.7 for 66.7%).

---

## Task 3: RankingService

**Files:**
- Create: `src/main/java/com/sport/web_sport/ranking/service/RankingService.java`

- [ ] **Step 1: Create the file**

```java
package com.sport.web_sport.ranking.service;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.ranking.dto.RankingTeamResponse;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    @Transactional(readOnly = true)
    public List<RankingTeamResponse> getRankings(SportType sportType) {
        List<Team> teams = teamRepository.findBySportTypeWithLeague(sportType);
        List<Match> finalMatches = matchRepository.findBySportTypeAndStatusWithTeams(sportType, MatchStatus.FINAL);

        // Accumulator map: teamId → [wins, draws, losses, scoresFor, scoresAgainst, points]
        Map<Long, int[]> acc = new LinkedHashMap<>();
        Map<Long, Team> teamMap = new HashMap<>();

        for (Team t : teams) {
            acc.put(t.getId(), new int[6]);
            teamMap.put(t.getId(), t);
        }

        for (Match m : finalMatches) {
            Long homeId = m.getHomeTeam().getId();
            Long awayId = m.getAwayTeam().getId();
            int hs = m.getHomeScore() != null ? m.getHomeScore() : 0;
            int as = m.getAwayScore() != null ? m.getAwayScore() : 0;

            // Include teams that appear in matches but are not in the team list
            acc.putIfAbsent(homeId, new int[6]);
            acc.putIfAbsent(awayId, new int[6]);
            teamMap.putIfAbsent(homeId, m.getHomeTeam());
            teamMap.putIfAbsent(awayId, m.getAwayTeam());

            int[] home = acc.get(homeId);
            int[] away = acc.get(awayId);

            // indices: [0]=wins [1]=draws [2]=losses [3]=scoresFor [4]=scoresAgainst [5]=points
            home[3] += hs;
            home[4] += as;
            away[3] += as;
            away[4] += hs;

            if (hs > as) {
                home[0]++;
                away[2]++;
                if (sportType == SportType.SOCCER) {
                    home[5] += 3;
                }
            } else if (hs < as) {
                away[0]++;
                home[2]++;
                if (sportType == SportType.SOCCER) {
                    away[5] += 3;
                }
            } else {
                home[1]++;
                away[1]++;
                if (sportType == SportType.SOCCER) {
                    home[5]++;
                    away[5]++;
                }
            }
        }

        List<RankingTeamResponse> list = new ArrayList<>();
        for (Map.Entry<Long, int[]> e : acc.entrySet()) {
            Long teamId = e.getKey();
            int[] s = e.getValue();
            Team team = teamMap.get(teamId);
            if (team == null) continue;

            int wins = s[0], draws = s[1], losses = s[2];
            int scoresFor = s[3], scoresAgainst = s[4], points = s[5];
            int gamesPlayed = wins + draws + losses;
            double winRate = gamesPlayed > 0 ? Math.round(wins * 1000.0 / gamesPlayed) / 10.0 : 0.0;
            String leagueName = team.getLeague() != null ? team.getLeague().getLeagueName() : null;

            list.add(RankingTeamResponse.builder()
                    .rank(0)
                    .teamId(teamId)
                    .teamName(team.getTeamName())
                    .sportType(sportType)
                    .leagueName(leagueName)
                    .gamesPlayed(gamesPlayed)
                    .wins(wins)
                    .draws(draws)
                    .losses(losses)
                    .winRate(winRate)
                    .points(points)
                    .scoresFor(scoresFor)
                    .scoresAgainst(scoresAgainst)
                    .scoreDifference(scoresFor - scoresAgainst)
                    .build());
        }

        // Sort by sport-specific rules
        if (sportType == SportType.SOCCER) {
            // 1. points desc  2. wins desc  3. scoreDiff desc  4. scoresFor desc  5. teamName asc
            list.sort((a, b) -> {
                if (b.getPoints() != a.getPoints()) return b.getPoints() - a.getPoints();
                if (b.getWins() != a.getWins()) return b.getWins() - a.getWins();
                if (b.getScoreDifference() != a.getScoreDifference()) return b.getScoreDifference() - a.getScoreDifference();
                if (b.getScoresFor() != a.getScoresFor()) return b.getScoresFor() - a.getScoresFor();
                return a.getTeamName().compareTo(b.getTeamName());
            });
        } else {
            // 1. winRate desc  2. wins desc  3. scoreDiff desc  4. scoresFor desc  5. teamName asc
            list.sort((a, b) -> {
                int cmp = Double.compare(b.getWinRate(), a.getWinRate());
                if (cmp != 0) return cmp;
                if (b.getWins() != a.getWins()) return b.getWins() - a.getWins();
                if (b.getScoreDifference() != a.getScoreDifference()) return b.getScoreDifference() - a.getScoreDifference();
                if (b.getScoresFor() != a.getScoresFor()) return b.getScoresFor() - a.getScoresFor();
                return a.getTeamName().compareTo(b.getTeamName());
            });
        }

        // Assign rank using toBuilder() (rank was 0 before sort)
        List<RankingTeamResponse> ranked = new ArrayList<>(list.size());
        for (int i = 0; i < list.size(); i++) {
            ranked.add(list.get(i).toBuilder().rank(i + 1).build());
        }
        return ranked;
    }
}
```

**Notes:**
- `teamRepository.findBySportTypeWithLeague` (already exists) eagerly loads league — safe to call `team.getLeague()`.
- `matchRepository.findBySportTypeAndStatusWithTeams` (added in Task 1) eagerly loads homeTeam, awayTeam, league.
- `acc.putIfAbsent` handles teams that appear in matches but are missing from the `team` table (defensive).
- `@Builder(toBuilder = true)` on the DTO enables `list.get(i).toBuilder().rank(i + 1).build()`.
- `MatchStatus.FINAL` (not `CANCELLED` — the enum spells it `CANCELED`).

---

## Task 4: RankingController + Backend Compile

**Files:**
- Create: `src/main/java/com/sport/web_sport/ranking/controller/RankingController.java`

- [ ] **Step 1: Create the controller**

```java
package com.sport.web_sport.ranking.controller;

import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.ranking.dto.RankingTeamResponse;
import com.sport.web_sport.ranking.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    @GetMapping("/{sportType}")
    public ApiResponse<List<RankingTeamResponse>> getRankings(
            @PathVariable SportType sportType) {
        return ApiResponse.ok(rankingService.getRankings(sportType));
    }
}
```

**Notes:**
- `@PathVariable SportType sportType` — Spring automatically converts `"SOCCER"` → `SportType.SOCCER`. Invalid values (e.g., `"HOCKEY"`) throw `MethodArgumentTypeMismatchException`, which `GlobalExceptionHandler` already handles with a JSON error response. No try/catch needed.
- Endpoints: `GET /api/rankings/SOCCER`, `GET /api/rankings/BASEBALL`, `GET /api/rankings/ESPORTS`

- [ ] **Step 2: Verify backend compiles**

```powershell
cd "E:\web3\web-sport-react-rebuild"
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

Common failures:
- `cannot find symbol: MatchRepository` → verify import `com.sport.web_sport.sports.repository.MatchRepository`
- `cannot find symbol: TeamRepository` → verify import `com.sport.web_sport.sports.repository.TeamRepository`
- `cannot find symbol: toBuilder` → verify DTO has `@Builder(toBuilder = true)` not just `@Builder`

---

## Task 5: Create `rankingApi.js`

**Files:**
- Create: `frontend/src/api/rankingApi.js`

- [ ] **Step 1: Create the file**

```js
import axiosInstance from './axiosInstance';

export const getRankings = (sportType, signal) =>
  axiosInstance.get(`/rankings/${sportType}`, { signal });
```

**Notes:**
- `sportType` is the uppercase enum string: `"SOCCER"`, `"BASEBALL"`, or `"ESPORTS"`.
- `signal` is optional — used with `AbortController` in `RankingsPage`.
- Response body: `{ success, message, data: RankingTeamResponse[] }` — access via `res.data.data`.

---

## Task 6: Create `RankingTable.jsx`

**Files:**
- Create: `frontend/src/components/RankingTable.jsx`

- [ ] **Step 1: Create the file**

```jsx
export default function RankingTable({ rankings, sportType }) {
  if (!rankings || rankings.length === 0) {
    return <p className="empty-text">등록된 팀 데이터가 없습니다.</p>;
  }

  const isSoccer = sportType === 'SOCCER';

  return (
    <div className="ranking-table-wrap">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>순위</th>
            <th className="team-name-cell">팀명</th>
            <th>경기 수</th>
            <th>승</th>
            <th>무</th>
            <th>패</th>
            <th>승률</th>
            <th>득점</th>
            <th>실점</th>
            <th>득실차</th>
            <th>승점</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((row) => {
            const diff = row.scoreDifference;
            const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
            const diffText = diff > 0 ? `+${diff}` : `${diff}`;
            return (
              <tr key={row.teamId}>
                <td><span className="rank-badge">{row.rank}</span></td>
                <td className="team-name-cell">{row.teamName}</td>
                <td>{row.gamesPlayed}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.winRate}%</td>
                <td>{row.scoresFor}</td>
                <td>{row.scoresAgainst}</td>
                <td className={diffClass}>{diffText}</td>
                <td>{isSoccer ? <strong>{row.points}</strong> : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Notes:**
- All 11 columns always shown — `승점` shows "-" for BASEBALL/ESPORTS.
- `draws` is shown as 0 for non-soccer (accurate — no hiding needed).
- `diffClass`/`diffText` computed per row to highlight positive/negative score differences.
- No API calls — all data from props.
- File extension must be `.jsx`.

---

## Task 7: Create `RankingsPage.jsx`

**Files:**
- Create: `frontend/src/pages/RankingsPage.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRankings } from '../api/rankingApi';
import RankingTable from '../components/RankingTable';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';

const SPORT_TABS = [
  { key: 'soccer',   label: '축구',    apiKey: 'SOCCER' },
  { key: 'baseball', label: '야구',    apiKey: 'BASEBALL' },
  { key: 'esports',  label: 'e스포츠', apiKey: 'ESPORTS' },
];

export default function RankingsPage() {
  const { sportType } = useParams();
  const navigate = useNavigate();

  const current = SPORT_TABS.find((t) => t.key === sportType) || SPORT_TABS[0];

  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getRankings(current.apiKey, controller.signal)
      .then((res) => setRankings(res.data.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('랭킹을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [current.apiKey]);

  return (
    <div className="rankings-page">
      <h1 className="page-title">팀 순위</h1>
      <div className="ranking-tabs">
        {SPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`btn${current.key === tab.key ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => navigate(`/rankings/${tab.key}`)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading && <LoadingState />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <RankingTable rankings={rankings} sportType={current.apiKey} />
      )}
    </div>
  );
}
```

**Notes:**
- `current = SPORT_TABS.find(t => t.key === sportType) || SPORT_TABS[0]` — if URL is `/rankings/unknown`, defaults to soccer tab without crashing.
- `useEffect` depends on `current.apiKey` — re-fetches when tab changes (since navigate triggers sportType param change).
- AbortController cancels in-flight request when switching tabs rapidly.
- Tabs use `navigate` to change the URL — this keeps the browser history correct.

---

## Task 8: Update `AppRouter.jsx` + `Header.jsx`

**Files:**
- Modify: `frontend/src/router/AppRouter.jsx`
- Modify: `frontend/src/components/Header.jsx`

- [ ] **Step 1: Update AppRouter.jsx**

Replace the entire file:

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
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<ErrorPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Key changes:**
- Added `Navigate` to the react-router-dom import
- Added `import RankingsPage from '../pages/RankingsPage'`
- Added `<Route path="rankings" element={<Navigate to="/rankings/soccer" replace />} />` — `/rankings` redirects to `/rankings/soccer`
- Added `<Route path="rankings/:sportType" element={<RankingsPage />} />`

- [ ] **Step 2: Update Header.jsx**

Add Rankings nav link. Replace the entire file:

```jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, isLoggedIn, isAdmin, logoutUser } = useAuth();
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
          {isAdmin && <Link to="/admin">Admin</Link>}
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

**Key change:** Added `<Link to="/rankings/soccer">Rankings</Link>` between Matches and Sports.

---

## Task 9: Append Ranking CSS

**Files:**
- Modify (append only): `frontend/src/styles/components.css`

- [ ] **Step 1: Append to end of file**

```css
/* ===== Rankings Page ===== */
.rankings-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: var(--color-text);
}

.ranking-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

/* ===== Ranking Table ===== */
.ranking-table-wrap {
  overflow-x: auto;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
  font-size: 0.875rem;
  white-space: nowrap;
}

.ranking-table th,
.ranking-table td {
  padding: 0.65rem 0.9rem;
  text-align: center;
  border-bottom: 1px solid var(--color-border);
}

.ranking-table th {
  background: var(--color-bg);
  font-weight: 700;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.ranking-table tbody tr:hover {
  background: var(--color-bg);
}

.ranking-table td.team-name-cell,
.ranking-table th.team-name-cell {
  text-align: left;
  min-width: 120px;
  font-weight: 600;
}

/* ===== Rank Badge ===== */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.8rem;
  background: var(--color-bg);
  color: var(--color-text-muted);
}

.ranking-table tbody tr:nth-child(1) .rank-badge {
  background: #ffd700;
  color: #7a5c00;
}

.ranking-table tbody tr:nth-child(2) .rank-badge {
  background: #c0c0c0;
  color: #444;
}

.ranking-table tbody tr:nth-child(3) .rank-badge {
  background: #cd7f32;
  color: #fff;
}

/* ===== Score difference ===== */
.ranking-table td.positive {
  color: #16a34a;
  font-weight: 600;
}

.ranking-table td.negative {
  color: #dc2626;
  font-weight: 600;
}

/* ===== Empty table state ===== */
.empty-text {
  color: var(--color-text-muted);
  text-align: center;
  padding: 2rem;
  font-size: 0.9rem;
}
```

---

## Task 10: Verify Builds

**Files:** none

- [ ] **Step 1: Run frontend build**

```powershell
cd "E:\web3\web-sport-react-rebuild\frontend"
npm run build
```

Expected: `✓ built in Xs` with no errors.

Common failures:
- `Cannot find module '../api/rankingApi'` → verify `src/api/rankingApi.js` exists
- `Cannot find module '../components/RankingTable'` → verify `RankingTable.jsx` exists
- JSX parse error → confirm `.jsx` extension on all component files

- [ ] **Step 2: Run backend compile**

```powershell
cd "E:\web3\web-sport-react-rebuild"
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

---

## Summary

### Backend Files Created/Modified
| File | Change |
|------|--------|
| `sports/repository/MatchRepository.java` | Added `findBySportTypeAndStatusWithTeams` JPQL query |
| `ranking/dto/RankingTeamResponse.java` | New DTO with 14 fields, `@Builder(toBuilder = true)` |
| `ranking/service/RankingService.java` | Accumulates stats from FINAL matches, sport-specific sort |
| `ranking/controller/RankingController.java` | `GET /api/rankings/{sportType}` |

### Frontend Files Created/Modified
| File | Change |
|------|--------|
| `src/api/rankingApi.js` | New — `getRankings(sportType, signal)` |
| `src/components/RankingTable.jsx` | New — 11-column table, rank badge, score diff color |
| `src/pages/RankingsPage.jsx` | New — sport tabs, fetch, loading/error/empty states |
| `src/router/AppRouter.jsx` | Added `/rankings` redirect + `/rankings/:sportType` route |
| `src/components/Header.jsx` | Added Rankings nav link |
| `src/styles/components.css` | Appended ranking/table/badge styles |

### Ranking Calculation Rules
- **SOCCER:** win=3pts, draw=1pt, loss=0pts. Sort: points↓, wins↓, scoreDiff↓, scoresFor↓, teamName↑
- **BASEBALL/ESPORTS:** wins only (no points). Sort: winRate↓, wins↓, scoreDiff↓, scoresFor↓, teamName↑
- All calculations in Java service layer, not DB queries
- Teams with 0 matches are included (from `teamRepository.findBySportTypeWithLeague`)

### API Endpoint
`GET /api/rankings/{sportType}` — sportType must be `SOCCER`, `BASEBALL`, or `ESPORTS` (uppercase). Invalid value returns a JSON 400 error via existing `GlobalExceptionHandler`.

### How to Test
1. Start backend: `.\mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Click "Rankings" in header → redirects to `/rankings/soccer`
4. Click tab buttons to switch between soccer/baseball/esports
5. Verify rank badges (gold/silver/bronze for top 3)
6. Test API directly: `GET http://localhost:8080/api/rankings/SOCCER`
7. Test invalid: `GET http://localhost:8080/api/rankings/HOCKEY` → JSON 400 error

### What Was Intentionally NOT Implemented
- League filtering (all teams of a sport type shown together)
- Season filtering (all-time FINAL results aggregated)
- Live ranking updates (no WebSocket)
- DRAW hidden for baseball/esports (draws column shows 0 — spec says this is acceptable)

### Next Recommended Step
**Phase 8: Match chat room** — implement real-time chat for matches using WebSocket (STOMP) or polling, replacing the `ChatPreview` placeholder.
