# MLB Schedule/Result Sync — Phase 1 Design

**Date:** 2026-05-19
**Branch:** BASEBALL
**Status:** Approved

---

## Goal

Implement MLB schedule/result synchronization. Admin triggers a date-range sync from the MLB Stats API; the backend fetches games and upserts them into the existing `League`, `Team`, and `Match` JPA entities using `sportType = BASEBALL`. No commit until user review.

## Out of Scope (Phase 1)

- Player statistics
- Strike zone
- Live pitch tracking
- Pre-match AI prediction

---

## Architecture

A self-contained `baseball` package lives alongside the existing `sports`, `admin`, and `user` packages. It does not modify any Soccer or Esports code.

```
baseball/
  controller/MlbSyncController.java
  service/MlbApiService.java
  service/MlbSyncService.java
  dto/MlbSyncRequest.java
  dto/MlbSyncResultResponse.java
```

Auth uses the existing `authService.requireAdmin(session)` pattern — no Spring Security changes.

---

## Data Model Changes

### Match entity — add `externalId`

```java
@Column(name = "external_id")
private String externalId;  // "MLB-{gamePk}", nullable
```

Kept nullable so all existing sample data is unaffected.

### MatchRepository — add

```java
Optional<Match> findByExternalId(String externalId);
```

### LeagueRepository — add

```java
Optional<League> findBySportTypeAndLeagueName(SportType sportType, String leagueName);
```

### TeamRepository — add

```java
Optional<Team> findBySportTypeAndTeamName(SportType sportType, String teamName);
```

---

## DTOs

### MlbSyncRequest

```java
@NotBlank String startDate;   // "yyyy-MM-dd"
@NotBlank String endDate;     // "yyyy-MM-dd"
```

### MlbSyncResultResponse

```java
String requestedStartDate;
String requestedEndDate;
int fetchedGames;
int createdMatches;
int updatedMatches;
int createdTeams;
int skippedGames;
String message;
```

---

## MlbApiService

Uses Spring Boot 3.x `RestClient` (available via `spring-boot-starter-web`).

Endpoint called:
```
GET https://statsapi.mlb.com/api/v1/schedule
    ?sportId=1
    &startDate={startDate}
    &endDate={endDate}
    &hydrate=team,venue
```

Parses only `dates[].games[]` with these fields:
- `gamePk`, `gameDate`, `season`
- `status.detailedState`, `status.abstractGameState`
- `teams.home.team.id`, `.name`, `.abbreviation`, `.score`
- `teams.away.team.id`, `.name`, `.abbreviation`, `.score`
- `venue.name`

Returns `List<JsonNode>` — the raw game nodes from `dates[].games[]`. No intermediate DTO class needed; `MlbSyncService` reads fields directly from `JsonNode`.

---

## MlbSyncService

### League upsert

Find by `sportType = BASEBALL` and `leagueName = "MLB"`.
If absent, create with `country = "USA"` and `season` from the year portion of `startDate`.

### Team upsert

Find by `sportType = BASEBALL` and `teamName = mlbTeamName`.
If absent, create:
- `sportType = BASEBALL`
- `league = MLB league`
- `teamName = mlbTeamName`
- `shortName = mlbAbbreviation`

### Match upsert

Find existing `Match` by `externalId = "MLB-" + gamePk`.

**If found:** update `homeScore`, `awayScore`, `status`, `venue`, `matchDate`. Increment `updatedMatches`.

**If not found:** create new match with all fields set, including `match.season` from the MLB game's `season` field. Increment `createdMatches`.

`skippedGames` increments when a game cannot be processed (e.g. missing required fields).

### Status mapping

| MLB `detailedState` | `MatchStatus` |
|---|---|
| Scheduled, Preview, Pre-Game, Warmup | `SCHEDULED` |
| In Progress, Live | `LIVE` |
| Final, Game Over, Completed Early | `FINAL` |
| Cancelled, Postponed, Suspended | `CANCELED` |
| anything else | `SCHEDULED` |

Note: the `MatchStatus` enum spells it `CANCELED` (one L).

---

## REST Endpoint

```
POST /api/admin/mlb/sync/schedule
```

- Request body: `MlbSyncRequest`
- Response: `ApiResponse<MlbSyncResultResponse>`
- Auth: `authService.requireAdmin(session)` called first
- Returns counts of fetched/created/updated/skipped games

---

## Frontend

### mlbApi.js (new)

```js
// frontend/src/api/mlbApi.js
import axiosInstance from './axiosInstance';

export const syncMlbSchedule = (startDate, endDate) =>
  axiosInstance.post('/admin/mlb/sync/schedule', { startDate, endDate });
```

### AdminDashboardPage.jsx (updated)

New section appended at the bottom of the existing page:

- **Title:** MLB 경기 데이터 동기화
- **Fields:** `startDate` input (default `2024-04-01`), `endDate` input (default `2024-04-07`)
- **Button:** MLB 일정 가져오기 — disabled while syncing
- **Success:** shows `fetchedGames`, `createdMatches`, `updatedMatches`, `createdTeams`, `skippedGames`
- **Error:** shows error message string

---

## Verification

```bash
cd frontend && npm run build
cd .. && ./mvnw.cmd compile
```

---

## Not Implemented (Phase 1)

- Player statistics
- Strike zone visualization
- Live pitch tracking
- Pre-match AI prediction
- Automatic/scheduled sync (manual admin trigger only)
