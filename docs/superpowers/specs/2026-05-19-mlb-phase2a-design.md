# MLB Phase 2A — Auto Sync + Match Sections UX Design

**Date:** 2026-05-19
**Branch:** BASEBALL
**Depends on:** MLB Phase 1 (externalId, MlbSyncService, MlbApiService)
**Status:** Approved

---

## Goal

1. Add backend scheduled MLB auto sync (daily + every 5 min) so results stay fresh without manual admin action.
2. Add `GET /api/matches/sections` endpoint returning live / recently finished / upcoming matches (optionally filtered by sport).
3. Add `MatchSections` React component and surface it at the top of `MatchListPage`.
4. Add a "view synced games" link after a successful admin MLB sync.

## Out of Scope

- Player statistics
- Strike zone
- Live play-by-play
- Pre-match AI prediction
- Git commit (user reviews first)

---

## Architecture

Four independent changes that share no state:

1. `@EnableScheduling` on `WebSportApplication` unlocks Spring's scheduler.
2. `MlbScheduledSyncService` owns the two cron jobs and calls `MlbSyncService`.
3. `MlbSyncService` gains an overloaded `sync(String, String)` entry point for programmatic use.
4. `MatchSectionsResponse` DTO + `findTopByStatusWithTeams` repo query + `MatchService.findMatchSections()` + `GET /api/matches/sections` endpoint form the sections API.
5. `MatchSections.jsx` + updates to `MatchListPage.jsx`, `matchApi.js`, and `AdminDashboardPage.jsx` form the frontend.

---

## Backend

### 1. Enable Scheduling

`src/main/java/com/sport/web_sport/WebSportApplication.java`

Add `@EnableScheduling` annotation. No other change.

```java
@SpringBootApplication
@EnableScheduling
public class WebSportApplication { ... }
```

---

### 2. MlbSyncService — overloaded entry point

Add a public `sync(String startDate, String endDate)` method that contains the actual sync logic. The existing `sync(MlbSyncRequest request)` delegates to it:

```java
public MlbSyncResultResponse sync(MlbSyncRequest request) {
    return sync(request.getStartDate(), request.getEndDate());
}

@Transactional
public MlbSyncResultResponse sync(String startDate, String endDate) {
    // existing logic, now using the String parameters directly
}
```

Only the existing logic moves — no behavior change.

---

### 3. MlbScheduledSyncService (new)

`src/main/java/com/sport/web_sport/baseball/service/MlbScheduledSyncService.java`

- `@Slf4j`, `@Service`, `@RequiredArgsConstructor`
- Injects `MlbSyncService`

**Job A — daily broad sync (3:00 AM server time):**
```java
@Scheduled(cron = "0 0 3 * * *")
public void dailySync() { ... }
```
Date range: `today.minusDays(2)` → `today.plusDays(7)`
Purpose: keeps recent results and upcoming schedule up to date.

**Job B — frequent live/recent sync (every 5 minutes):**
```java
@Scheduled(fixedRate = 300_000)
public void liveSync() { ... }
```
Date range: `today.minusDays(1)` → `today.plusDays(1)`
Purpose: updates LIVE scores and same-day results.

Both jobs:
- Catch all `Exception`, log at WARN with the exception message
- Log success at INFO with counts from `MlbSyncResultResponse`
- Never propagate exceptions (scheduler must not be disrupted)
- Use `LocalDate.now()` (server timezone — acceptable for Phase 2A)

---

### 4. MatchRepository — new query

```java
@Query("""
    select m from Match m
    join fetch m.homeTeam
    join fetch m.awayTeam
    join fetch m.league
    where (:sportType is null or m.sportType = :sportType)
      and m.status = :status
    order by m.matchDate desc
    """)
List<Match> findTopByStatusWithTeams(
    @Param("sportType") SportType sportType,
    @Param("status") MatchStatus status,
    Pageable pageable);
```

Called with:
- LIVE/FINAL: `PageRequest.of(0, 6)` (desc by matchDate — already in query)
- SCHEDULED: `PageRequest.of(0, 6, Sort.by("matchDate").ascending())`

Note: passing a `Sort` via `Pageable` overrides the `order by` clause in JPQL for most JPA providers. If Oracle/Hibernate does not honor the Pageable sort override on a query with explicit `order by`, add a second query for ascending. Test at runtime.

---

### 5. MatchSectionsResponse (new DTO)

`src/main/java/com/sport/web_sport/sports/dto/response/MatchSectionsResponse.java`

```java
@Getter @Builder
public class MatchSectionsResponse {
    private List<MatchResponse> liveMatches;
    private List<MatchResponse> recentFinishedMatches;
    private List<MatchResponse> upcomingMatches;
}
```

---

### 6. MatchService — findMatchSections

Add to `MatchService`:

```java
public MatchSectionsResponse findMatchSections(SportType sportType) {
    Pageable top6desc = PageRequest.of(0, 6);
    Pageable top6asc  = PageRequest.of(0, 6, Sort.by("matchDate").ascending());

    List<MatchResponse> live = matchRepository
        .findTopByStatusWithTeams(sportType, MatchStatus.LIVE, top6desc)
        .stream().map(MatchResponse::from).toList();

    List<MatchResponse> recent = matchRepository
        .findTopByStatusWithTeams(sportType, MatchStatus.FINAL, top6desc)
        .stream().map(MatchResponse::from).toList();

    List<MatchResponse> upcoming = matchRepository
        .findTopByStatusWithTeams(sportType, MatchStatus.SCHEDULED, top6asc)
        .stream().map(MatchResponse::from).toList();

    return MatchSectionsResponse.builder()
        .liveMatches(live)
        .recentFinishedMatches(recent)
        .upcomingMatches(upcoming)
        .build();
}
```

`sportType` is nullable — null means all sports.

---

### 7. MatchApiController — sections endpoint

Add to `MatchApiController`:

```java
@GetMapping("/sections")
public MatchSectionsResponse sections(
        @RequestParam(required = false) SportType sportType) {
    return matchService.findMatchSections(sportType);
}
```

Full URL: `GET /api/matches/sections?sportType=BASEBALL` (sportType optional).
No auth required. Returns `MatchSectionsResponse` directly — consistent with how the existing list endpoint returns `PageResponse` directly (no `ApiResponse` wrapper).

---

## Frontend

### 8. matchApi.js

Add to `frontend/src/api/matchApi.js`:

```js
export const getMatchSections = (params, signal) =>
  axiosInstance.get('/matches/sections', { params, signal });
```

`params` may include `{ sportType: 'BASEBALL' }` or be empty/undefined.

---

### 9. MatchSections.jsx (new component)

`frontend/src/components/MatchSections.jsx`

Props: `sportType` (optional string)

Behavior:
- Fetches `getMatchSections({ sportType })` on mount and whenever `sportType` changes
- Shows loading state while fetching
- Shows three titled sections using existing CSS classes:
  - **진행 중인 경기** (`liveMatches`)
  - **최근 종료 경기** (`recentFinishedMatches`)
  - **다가오는 경기** (`upcomingMatches`)
- Each section: a grid of `<MatchCard>` cards, or `<EmptyState>` (existing component) if the list is empty
- Error state: shows an `<ErrorBox>` (existing component)
- Abort controller on unmount

---

### 10. MatchListPage.jsx

Above the existing filter bar (`<form className="filter-bar card">`), add:

```jsx
<section className="admin-section">
  <h2 className="admin-section-title">전체 경기 현황</h2>
  <MatchSections sportType={form.sportType || undefined} />
</section>
```

`form.sportType` is already in state from the existing filter — no new state needed. When the user applies a BASEBALL filter the sections panel updates automatically.

The existing filter bar, match grid, and pagination are completely unchanged.

---

### 11. AdminDashboardPage.jsx — MLB sync link

After a successful sync (`syncResult` is set), add a link below the result summary:

```jsx
{syncResult && (
  <>
    <ul className="count-list">...</ul>
    <a
      href={`/matches?sportType=BASEBALL&year=${syncStartDate.substring(0,4)}&month=${parseInt(syncStartDate.substring(5,7), 10)}`}
      style={{ display: 'inline-block', marginTop: '0.5rem' }}
    >
      동기화된 MLB 경기 보기
    </a>
  </>
)}
```

Uses `syncStartDate` state (already in component) to derive year and month.

---

## Not Implemented (Phase 2A)

- Player statistics
- Strike zone
- Live play-by-play
- Pre-match AI prediction
- Automatic retry on MLB API failure (failures are logged and skipped)
