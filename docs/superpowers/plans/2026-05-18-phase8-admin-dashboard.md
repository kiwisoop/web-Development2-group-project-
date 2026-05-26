# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin dashboard showing key project statistics (counts, recent matches, recent users, sport/status breakdowns) via a new `GET /api/admin/dashboard` endpoint and a React page replacing the existing placeholder.

**Architecture:** New `com.sport.web_sport.admin` package on the backend with service + controller. Frontend replaces the `AdminDashboardPage.jsx` placeholder. Endpoint is open (no Spring Security per project rules). Header Admin link is always visible since `User` entity has no role field and `isAdmin` is always false.

**Tech Stack:** Spring Boot 3, Jakarta Persistence, Lombok, Spring Data JPA derived queries; React 18, plain CSS, axios

---

### Task 1: Add repository query methods

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/repository/MatchRepository.java`
- Modify: `src/main/java/com/sport/web_sport/analysis/repository/MatchAnalysisRepository.java`
- Modify: `src/main/java/com/sport/web_sport/user/repository/UserRepository.java`

- [ ] **Step 1: Add countByStatus and countBySportType to MatchRepository**

Add two method signatures after the existing `findTop10ByOrderByMatchDateDesc()` line. Full updated file:

```java
package com.sport.web_sport.sports.repository;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Match;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findBySportType(SportType sportType);
    List<Match> findByStatus(MatchStatus status);
    List<Match> findByLeagueId(Long leagueId);
    List<Match> findByHomeTeamIdOrAwayTeamId(Long homeTeamId, Long awayTeamId);
    List<Match> findTop10ByOrderByMatchDateDesc();
    long countByStatus(MatchStatus status);
    long countBySportType(SportType sportType);

    @Query("select m from Match m join fetch m.homeTeam join fetch m.awayTeam order by m.matchDate desc")
    List<Match> findTop10WithTeams(Pageable pageable);

    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            join fetch m.league
            where m.id = :id
            """)
    java.util.Optional<Match> findByIdWithTeams(@Param("id") Long id);

    @Query("""
            select m from Match m
            join fetch m.homeTeam ht
            join fetch m.awayTeam at
            join fetch m.league l
            where (:sportType is null or m.sportType = :sportType)
              and (:status is null or m.status = :status)
              and (:leagueId is null or l.id = :leagueId)
              and (:teamId is null or ht.id = :teamId or at.id = :teamId)
              and (:start is null or m.matchDate >= :start)
              and (:end is null or m.matchDate < :end)
              and (:keyword is null or :keyword = ''
                   or lower(ht.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(at.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(l.leagueName)  like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(m.venue, '')) like lower(concat('%', :keyword, '%')))
            order by m.matchDate desc
            """)
    List<Match> searchMatches(@Param("sportType") SportType sportType,
                              @Param("status") MatchStatus status,
                              @Param("leagueId") Long leagueId,
                              @Param("teamId") Long teamId,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end,
                              @Param("keyword") String keyword);

    @Query("""
            select m from Match m
            join fetch m.homeTeam ht
            join fetch m.awayTeam at
            join fetch m.league l
            where (:sportType is null or m.sportType = :sportType)
              and (:status is null or m.status = :status)
              and (:leagueId is null or l.id = :leagueId)
              and (:teamId is null or ht.id = :teamId or at.id = :teamId)
              and (:start is null or m.matchDate >= :start)
              and (:end is null or m.matchDate < :end)
              and (:keyword is null or :keyword = ''
                   or lower(ht.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(at.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(l.leagueName)  like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(m.venue, '')) like lower(concat('%', :keyword, '%')))
            """)
    Page<Match> searchMatchesPaged(@Param("sportType") SportType sportType,
                                   @Param("status") MatchStatus status,
                                   @Param("leagueId") Long leagueId,
                                   @Param("teamId") Long teamId,
                                   @Param("start") LocalDateTime start,
                                   @Param("end") LocalDateTime end,
                                   @Param("keyword") String keyword,
                                   Pageable pageable);

    @Query("""
            select m from Match m
            join fetch m.homeTeam ht
            join fetch m.awayTeam at
            join fetch m.league l
            where (:sportType is null or m.sportType = :sportType)
              and (:status is null or m.status = :status)
              and (:leagueId is null or l.id = :leagueId)
              and (:teamId is null or ht.id = :teamId or at.id = :teamId)
              and (:start is null or m.matchDate >= :start)
              and (:end is null or m.matchDate < :end)
              and (:keyword is null or :keyword = ''
                   or lower(ht.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(at.teamName)   like lower(concat('%', :keyword, '%'))
                   or lower(l.leagueName)  like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(m.venue, '')) like lower(concat('%', :keyword, '%')))
            order by case when m.status = com.sport.web_sport.common.type.MatchStatus.LIVE then 0 else 1 end,
                     m.matchDate desc
            """)
    Page<Match> searchMatchesLiveFirst(@Param("sportType") SportType sportType,
                                       @Param("status") MatchStatus status,
                                       @Param("leagueId") Long leagueId,
                                       @Param("teamId") Long teamId,
                                       @Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end,
                                       @Param("keyword") String keyword,
                                       Pageable pageable);

    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            join fetch m.league
            where (m.homeTeam.id in :teamIds or m.awayTeam.id in :teamIds)
            order by m.matchDate desc
            """)
    List<Match> findMatchesByTeamIds(@Param("teamIds") List<Long> teamIds, Pageable pageable);

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
}
```

- [ ] **Step 2: Add countByStatus to MatchAnalysisRepository**

Full updated file:

```java
package com.sport.web_sport.analysis.repository;

import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MatchAnalysisRepository extends JpaRepository<MatchAnalysis, Long> {
    Optional<MatchAnalysis> findByMatchIdAndProvider(Long matchId, AnalysisProvider provider);
    long countByStatus(AnalysisStatus status);
}
```

- [ ] **Step 3: Add findTop5ByOrderByCreatedAtDesc to UserRepository**

Full updated file:

```java
package com.sport.web_sport.user.repository;

import com.sport.web_sport.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findTop5ByOrderByCreatedAtDesc();
}
```

- [ ] **Step 4: Compile to verify**

Run: `.\mvnw.cmd compile`

Expected: `BUILD SUCCESS`

---

### Task 2: Admin DTOs

**Files:**
- Create: `src/main/java/com/sport/web_sport/admin/dto/RecentMatchResponse.java`
- Create: `src/main/java/com/sport/web_sport/admin/dto/RecentUserResponse.java`
- Create: `src/main/java/com/sport/web_sport/admin/dto/SportMatchCountResponse.java`
- Create: `src/main/java/com/sport/web_sport/admin/dto/AnalysisStatusCountResponse.java`
- Create: `src/main/java/com/sport/web_sport/admin/dto/AdminDashboardResponse.java`

Note: `AdminStatResponse` from the spec is handled by the `AdminStatCard` React component on the frontend — no backend DTO is needed since all stats are flat primitives in `AdminDashboardResponse`.

- [ ] **Step 1: Create RecentMatchResponse.java**

```java
package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RecentMatchResponse {
    private Long matchId;
    private String homeTeamName;
    private String awayTeamName;
    private String sportType;
    private String status;
    private LocalDateTime matchDate;
    private Integer homeScore;
    private Integer awayScore;
}
```

- [ ] **Step 2: Create RecentUserResponse.java**

```java
package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RecentUserResponse {
    private Long userId;
    private String username;
    private String nickname;
    private LocalDateTime createdAt;
}
```

- [ ] **Step 3: Create SportMatchCountResponse.java**

```java
package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SportMatchCountResponse {
    private String sportType;
    private long count;
}
```

- [ ] **Step 4: Create AnalysisStatusCountResponse.java**

```java
package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AnalysisStatusCountResponse {
    private String status;
    private long count;
}
```

- [ ] **Step 5: Create AdminDashboardResponse.java**

```java
package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AdminDashboardResponse {
    private long totalUsers;
    private long totalMatches;
    private long liveMatches;
    private long totalLeagues;
    private long totalTeams;
    private long totalPlayers;
    private long totalFavoriteTeams;
    private long totalAnalyses;
    private long doneAnalyses;
    private long failedAnalyses;
    private long totalPredictionVotes;
    private List<RecentMatchResponse> recentMatches;
    private List<RecentUserResponse> recentUsers;
    private List<SportMatchCountResponse> matchCountBySportType;
    private List<AnalysisStatusCountResponse> analysisCountByStatus;
}
```

---

### Task 3: AdminDashboardService + AdminDashboardController

**Files:**
- Create: `src/main/java/com/sport/web_sport/admin/service/AdminDashboardService.java`
- Create: `src/main/java/com/sport/web_sport/admin/controller/AdminDashboardController.java`

- [ ] **Step 1: Create AdminDashboardService.java**

```java
package com.sport.web_sport.admin.service;

import com.sport.web_sport.admin.dto.AdminDashboardResponse;
import com.sport.web_sport.admin.dto.AnalysisStatusCountResponse;
import com.sport.web_sport.admin.dto.RecentMatchResponse;
import com.sport.web_sport.admin.dto.RecentUserResponse;
import com.sport.web_sport.admin.dto.SportMatchCountResponse;
import com.sport.web_sport.analysis.repository.MatchAnalysisRepository;
import com.sport.web_sport.common.type.AnalysisStatus;
import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.favorite.repository.FavoriteTeamRepository;
import com.sport.web_sport.prediction.repository.PredictionVoteRepository;
import com.sport.web_sport.sports.repository.LeagueRepository;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.PlayerRepository;
import com.sport.web_sport.sports.repository.TeamRepository;
import com.sport.web_sport.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final LeagueRepository leagueRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final FavoriteTeamRepository favoriteTeamRepository;
    private final MatchAnalysisRepository matchAnalysisRepository;
    private final PredictionVoteRepository predictionVoteRepository;

    public AdminDashboardResponse buildDashboard() {
        List<RecentMatchResponse> recentMatches = matchRepository
                .findTop10WithTeams(PageRequest.of(0, 5))
                .stream()
                .map(m -> RecentMatchResponse.builder()
                        .matchId(m.getId())
                        .homeTeamName(m.getHomeTeam().getTeamName())
                        .awayTeamName(m.getAwayTeam().getTeamName())
                        .sportType(m.getSportType().name())
                        .status(m.getStatus().name())
                        .matchDate(m.getMatchDate())
                        .homeScore(m.getHomeScore())
                        .awayScore(m.getAwayScore())
                        .build())
                .collect(Collectors.toList());

        List<RecentUserResponse> recentUsers = userRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(u -> RecentUserResponse.builder()
                        .userId(u.getId())
                        .username(u.getUsername())
                        .nickname(u.getNickname())
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<SportMatchCountResponse> matchCountBySportType = Arrays.stream(SportType.values())
                .map(st -> SportMatchCountResponse.builder()
                        .sportType(st.name())
                        .count(matchRepository.countBySportType(st))
                        .build())
                .collect(Collectors.toList());

        List<AnalysisStatusCountResponse> analysisCountByStatus = Arrays.stream(AnalysisStatus.values())
                .map(s -> AnalysisStatusCountResponse.builder()
                        .status(s.name())
                        .count(matchAnalysisRepository.countByStatus(s))
                        .build())
                .collect(Collectors.toList());

        return AdminDashboardResponse.builder()
                .totalUsers(userRepository.count())
                .totalMatches(matchRepository.count())
                .liveMatches(matchRepository.countByStatus(MatchStatus.LIVE))
                .totalLeagues(leagueRepository.count())
                .totalTeams(teamRepository.count())
                .totalPlayers(playerRepository.count())
                .totalFavoriteTeams(favoriteTeamRepository.count())
                .totalAnalyses(matchAnalysisRepository.count())
                .doneAnalyses(matchAnalysisRepository.countByStatus(AnalysisStatus.DONE))
                .failedAnalyses(matchAnalysisRepository.countByStatus(AnalysisStatus.FAILED))
                .totalPredictionVotes(predictionVoteRepository.count())
                .recentMatches(recentMatches)
                .recentUsers(recentUsers)
                .matchCountBySportType(matchCountBySportType)
                .analysisCountByStatus(analysisCountByStatus)
                .build();
    }
}
```

- [ ] **Step 2: Create AdminDashboardController.java**

```java
package com.sport.web_sport.admin.controller;

import com.sport.web_sport.admin.dto.AdminDashboardResponse;
import com.sport.web_sport.admin.service.AdminDashboardService;
import com.sport.web_sport.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    // TODO: Add admin role check when Spring Security is introduced
    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardResponse> getDashboard() {
        return ApiResponse.ok(adminDashboardService.buildDashboard());
    }
}
```

- [ ] **Step 3: Compile to verify**

Run: `.\mvnw.cmd compile`

Expected: `BUILD SUCCESS`

---

### Task 4: Frontend API + AdminStatCard

**Files:**
- Create: `frontend/src/api/adminApi.js`
- Create: `frontend/src/components/AdminStatCard.jsx`

- [ ] **Step 1: Create adminApi.js**

```js
import axiosInstance from './axiosInstance';

export const getAdminDashboard = (signal) =>
  axiosInstance.get('/admin/dashboard', { signal });
```

- [ ] **Step 2: Create AdminStatCard.jsx**

```jsx
export default function AdminStatCard({ label, value, description }) {
  return (
    <div className="stat-card card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {description && <p className="stat-description">{description}</p>}
    </div>
  );
}
```

---

### Task 5: AdminDashboardPage + Header update

**Files:**
- Modify: `frontend/src/pages/AdminDashboardPage.jsx`
- Modify: `frontend/src/components/Header.jsx`

- [ ] **Step 1: Replace AdminDashboardPage.jsx**

Full file (replaces the `<div className="placeholder-page">` stub):

```jsx
import { useState, useEffect } from 'react';
import { getAdminDashboard } from '../api/adminApi';
import AdminStatCard from '../components/AdminStatCard';

const SPORT_LABELS = { SOCCER: '축구', BASEBALL: '야구', ESPORTS: 'e스포츠' };
const STATUS_LABELS = {
  NOT_CREATED: '미생성',
  GENERATING: '생성중',
  DONE: '완료',
  FAILED: '실패',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getAdminDashboard(controller.signal)
      .then(res => setData(res.data.data))
      .catch(err => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setError('대시보드를 불러오지 못했습니다.');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) return <div className="loading-text">로딩 중...</div>;
  if (error) return <div className="error-text">{error}</div>;
  if (!data) return null;

  return (
    <div className="admin-page">
      <h1 className="page-title">관리자 대시보드</h1>

      <section className="admin-section">
        <h2 className="admin-section-title">전체 통계</h2>
        <div className="stat-grid">
          <AdminStatCard label="전체 사용자" value={data.totalUsers} />
          <AdminStatCard label="전체 경기" value={data.totalMatches} />
          <AdminStatCard label="라이브 경기" value={data.liveMatches} />
          <AdminStatCard label="리그" value={data.totalLeagues} />
          <AdminStatCard label="팀" value={data.totalTeams} />
          <AdminStatCard label="선수" value={data.totalPlayers} />
          <AdminStatCard label="즐겨찾기 팀" value={data.totalFavoriteTeams} />
          <AdminStatCard label="전체 AI 분석" value={data.totalAnalyses} />
          <AdminStatCard label="완료 분석" value={data.doneAnalyses} />
          <AdminStatCard label="실패 분석" value={data.failedAnalyses} />
          <AdminStatCard label="승부 예측 투표" value={data.totalPredictionVotes} />
        </div>
      </section>

      <div className="admin-two-col">
        <section className="admin-section">
          <h2 className="admin-section-title">종목별 경기 수</h2>
          <ul className="count-list">
            {data.matchCountBySportType.map(item => (
              <li key={item.sportType} className="count-list-item">
                <span>{SPORT_LABELS[item.sportType] || item.sportType}</span>
                <span className="count-badge">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">분석 상태별 현황</h2>
          <ul className="count-list">
            {data.analysisCountByStatus.map(item => (
              <li key={item.status} className="count-list-item">
                <span>{STATUS_LABELS[item.status] || item.status}</span>
                <span className="count-badge">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="admin-section">
        <h2 className="admin-section-title">최근 경기</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>홈팀</th>
                <th>원정팀</th>
                <th>스코어</th>
                <th>종목</th>
                <th>상태</th>
                <th>경기일</th>
              </tr>
            </thead>
            <tbody>
              {data.recentMatches.map(m => (
                <tr key={m.matchId}>
                  <td>{m.matchId}</td>
                  <td>{m.homeTeamName}</td>
                  <td>{m.awayTeamName}</td>
                  <td>
                    {m.homeScore != null ? `${m.homeScore} : ${m.awayScore}` : '-'}
                  </td>
                  <td>{SPORT_LABELS[m.sportType] || m.sportType}</td>
                  <td>{m.status}</td>
                  <td>{m.matchDate ? new Date(m.matchDate).toLocaleDateString('ko-KR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">최근 가입 사용자</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>아이디</th>
                <th>닉네임</th>
                <th>가입일</th>
              </tr>
            </thead>
            <tbody>
              {data.recentUsers.map(u => (
                <tr key={u.userId}>
                  <td>{u.userId}</td>
                  <td>{u.username}</td>
                  <td>{u.nickname || '-'}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Update Header.jsx — always show Admin link**

Current line:
```jsx
{isAdmin && <Link to="/admin">Admin</Link>}
```

Replace with:
```jsx
<Link to="/admin">Admin</Link>
```

`User` entity has no role field; `MeResponse` always returns `role="USER"`, making `isAdmin` permanently false. Show the link unconditionally for development. Full updated `Header.jsx`:

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

- [ ] **Step 1: Append admin dashboard styles to components.css**

Append at the very end of the file:

```css
/* ── Admin Dashboard ──────────────────────────────── */
.admin-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.admin-section {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}

.admin-section-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--text-primary, #111);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1rem 0.75rem;
  border-radius: 0.5rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary, #6b7280);
  margin: 0 0 0.35rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--accent, #6366f1);
  margin: 0;
}

.stat-description {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  margin: 0.25rem 0 0;
}

.admin-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.count-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.count-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--bg, #f9fafb);
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.count-badge {
  font-weight: 600;
  color: var(--accent, #6366f1);
  background: var(--accent-light, #eef2ff);
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
}

.admin-table-wrap {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.admin-table th,
.admin-table td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border, #e5e7eb);
  white-space: nowrap;
}

.admin-table th {
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  background: var(--bg, #f9fafb);
}

.admin-table tr:last-child td {
  border-bottom: none;
}

@media (max-width: 640px) {
  .admin-two-col {
    grid-template-columns: 1fr;
  }

  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
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

## Summary

**Backend files created:**
- `src/main/java/com/sport/web_sport/admin/dto/RecentMatchResponse.java`
- `src/main/java/com/sport/web_sport/admin/dto/RecentUserResponse.java`
- `src/main/java/com/sport/web_sport/admin/dto/SportMatchCountResponse.java`
- `src/main/java/com/sport/web_sport/admin/dto/AnalysisStatusCountResponse.java`
- `src/main/java/com/sport/web_sport/admin/dto/AdminDashboardResponse.java`
- `src/main/java/com/sport/web_sport/admin/service/AdminDashboardService.java`
- `src/main/java/com/sport/web_sport/admin/controller/AdminDashboardController.java`

**Backend files modified:**
- `MatchRepository.java` — added `countByStatus`, `countBySportType`
- `MatchAnalysisRepository.java` — added `countByStatus`
- `UserRepository.java` — added `findTop5ByOrderByCreatedAtDesc`

**Frontend files created:**
- `frontend/src/api/adminApi.js`
- `frontend/src/components/AdminStatCard.jsx`

**Frontend files modified:**
- `frontend/src/pages/AdminDashboardPage.jsx` — full dashboard replacing placeholder
- `frontend/src/components/Header.jsx` — Admin link always visible
- `frontend/src/styles/components.css` — admin styles appended

**API endpoint:** `GET /api/admin/dashboard` → `ApiResponse<AdminDashboardResponse>`

**Admin access decision:** Endpoint is open with a TODO comment. Header shows Admin link for all users. `User` entity has no role field so `isAdmin` is permanently false in current auth — proper guard can be added when Spring Security is introduced.

**Not implemented:** `AdminStatResponse` backend DTO (not needed — flat primitives in `AdminDashboardResponse` cover all stats; the `AdminStatCard` component handles the frontend card representation).

**How to test:**
1. Start backend: `.\mvnw.cmd spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:5173/admin`
4. Verify all 11 stat cards load, both tables show data, sport/status counts are accurate
5. Inspect raw JSON at `http://localhost:8080/api/admin/dashboard`
