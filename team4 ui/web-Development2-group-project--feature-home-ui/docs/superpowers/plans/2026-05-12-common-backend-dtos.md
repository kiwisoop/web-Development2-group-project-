# Common Backend DTOs & detail-full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize REST response payloads by introducing response DTOs across sports/favorite/analysis APIs and complete the `/api/matches/{id}/detail-full` endpoint to return a single aggregated payload (without invoking Gemini).

**Architecture:** Add a `sports/dto/response` package containing simple DTOs with `from(entity)` static factories. Refactor existing controllers to return DTOs instead of JPA entities to eliminate lazy-loading / circular-reference issues. Extend `MatchService.findDetailFull` to also resolve favorite status and login flag using `HttpSession` (passed from the controller), and wrap the result in `MatchDetailFullResponse`. Move `AnalysisResponse` out of the controller into the DTO package.

**Tech Stack:** Spring Boot 3.5.14, Java 17, JPA, Lombok, Thymeleaf, Oracle. No Spring Security, no React.

**Conventions observed in existing code:**
- Lombok `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder` on entities.
- Korean error messages via `BusinessException`.
- Session helpers on `AuthService`: `getLoginUserId(session)` (nullable) and `requireLoginUserId(session)` (throws).
- `AnalysisService.getSavedAnalysis(matchId, provider)` returns `Optional<MatchAnalysis>` without calling Gemini.

---

## File Structure

**Create (new DTOs under `src/main/java/com/sport/web_sport/sports/dto/response/`):**
- `LeagueResponse.java`
- `TeamResponse.java`
- `MatchResponse.java`
- `MatchStatResponse.java`
- `MatchEventResponse.java`
- `AnalysisResponse.java`
- `MatchDetailFullResponse.java`
- `FavoriteTeamResponse.java`

**Modify:**
- `sports/controller/MatchApiController.java` — return DTOs; add `HttpSession` to `detail-full`.
- `sports/controller/SportApiController.java` — return DTOs; add flat list endpoints.
- `sports/service/SportsService.java` — add `findAllPlayers()` helper.
- `sports/service/MatchService.java` — replace `findDetailFull` return type with `MatchDetailFullResponse`, accept `HttpSession`.
- `favorite/controller/FavoriteApiController.java` — return DTOs.
- `analysis/controller/AnalysisApiController.java` — use shared `AnalysisResponse` DTO, drop inner class.
- `sports/dto/MatchDetailDto.java` — delete (superseded by `MatchDetailFullResponse`).

**Affected (read-only checks):**
- `sports/controller/MatchPageController.java`, `sports/controller/SportPageController.java`, `favorite/controller/FavoritePageController.java` — verify they don't depend on the old `MatchDetailDto`.

---

## Task 1: Create LeagueResponse and TeamResponse DTOs

**Files:**
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/LeagueResponse.java`
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/TeamResponse.java`

- [ ] **Step 1: Write `LeagueResponse.java`**

```java
package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.League;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LeagueResponse {
    private Long id;
    private SportType sportType;
    private String leagueName;
    private String season;
    private String country;

    public static LeagueResponse from(League league) {
        if (league == null) return null;
        return LeagueResponse.builder()
                .id(league.getId())
                .sportType(league.getSportType())
                .leagueName(league.getLeagueName())
                .season(league.getSeason())
                .country(league.getCountry())
                .build();
    }
}
```

- [ ] **Step 2: Write `TeamResponse.java`**

```java
package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Team;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TeamResponse {
    private Long id;
    private SportType sportType;
    private Long leagueId;
    private String leagueName;
    private String teamName;
    private String shortName;
    private String logoUrl;
    private String country;

    public static TeamResponse from(Team team) {
        if (team == null) return null;
        return TeamResponse.builder()
                .id(team.getId())
                .sportType(team.getSportType())
                .leagueId(team.getLeague() != null ? team.getLeague().getId() : null)
                .leagueName(team.getLeague() != null ? team.getLeague().getLeagueName() : null)
                .teamName(team.getTeamName())
                .shortName(team.getShortName())
                .logoUrl(team.getLogoUrl())
                .country(team.getCountry())
                .build();
    }
}
```

- [ ] **Step 3: Compile**

Run: `./gradlew compileJava` (or `mvnw compile` if Maven). Project uses Maven (`pom.xml`):
Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add src/main/java/com/sport/web_sport/sports/dto/response/LeagueResponse.java \
        src/main/java/com/sport/web_sport/sports/dto/response/TeamResponse.java
git commit -m "feat(dto): add LeagueResponse, TeamResponse"
```

---

## Task 2: Create MatchStatResponse, MatchEventResponse, MatchResponse DTOs

**Files:**
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/MatchStatResponse.java`
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/MatchEventResponse.java`
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/MatchResponse.java`

- [ ] **Step 1: Write `MatchStatResponse.java`**

```java
package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.sports.entity.MatchStat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MatchStatResponse {
    private Long id;
    private Long teamId;
    private String teamName;
    private String statName;
    private String statValue;

    public static MatchStatResponse from(MatchStat stat) {
        if (stat == null) return null;
        return MatchStatResponse.builder()
                .id(stat.getId())
                .teamId(stat.getTeam() != null ? stat.getTeam().getId() : null)
                .teamName(stat.getTeam() != null ? stat.getTeam().getTeamName() : null)
                .statName(stat.getStatName())
                .statValue(stat.getStatValue())
                .build();
    }
}
```

- [ ] **Step 2: Write `MatchEventResponse.java`**

```java
package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.sports.entity.MatchEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MatchEventResponse {
    private Long id;
    private Long teamId;
    private String teamName;
    private Long playerId;
    private String playerName;
    private String eventTime;
    private String eventType;
    private String description;
    private String scoreAfterEvent;

    public static MatchEventResponse from(MatchEvent event) {
        if (event == null) return null;
        return MatchEventResponse.builder()
                .id(event.getId())
                .teamId(event.getTeam() != null ? event.getTeam().getId() : null)
                .teamName(event.getTeam() != null ? event.getTeam().getTeamName() : null)
                .playerId(event.getPlayer() != null ? event.getPlayer().getId() : null)
                .playerName(event.getPlayer() != null ? event.getPlayer().getPlayerName() : null)
                .eventTime(event.getEventTime())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .scoreAfterEvent(event.getScoreAfterEvent())
                .build();
    }
}
```

- [ ] **Step 3: Write `MatchResponse.java`**

```java
package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Match;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class MatchResponse {
    private Long id;
    private SportType sportType;
    private MatchStatus status;
    private String season;
    private LocalDateTime matchDate;
    private String venue;
    private Integer homeScore;
    private Integer awayScore;
    private LeagueResponse league;
    private TeamResponse homeTeam;
    private TeamResponse awayTeam;

    public static MatchResponse from(Match match) {
        if (match == null) return null;
        return MatchResponse.builder()
                .id(match.getId())
                .sportType(match.getSportType())
                .status(match.getStatus())
                .season(match.getSeason())
                .matchDate(match.getMatchDate())
                .venue(match.getVenue())
                .homeScore(match.getHomeScore())
                .awayScore(match.getAwayScore())
                .league(LeagueResponse.from(match.getLeague()))
                .homeTeam(TeamResponse.from(match.getHomeTeam()))
                .awayTeam(TeamResponse.from(match.getAwayTeam()))
                .build();
    }
}
```

- [ ] **Step 4: Compile**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/sport/web_sport/sports/dto/response/MatchStatResponse.java \
        src/main/java/com/sport/web_sport/sports/dto/response/MatchEventResponse.java \
        src/main/java/com/sport/web_sport/sports/dto/response/MatchResponse.java
git commit -m "feat(dto): add MatchResponse, MatchStatResponse, MatchEventResponse"
```

---

## Task 3: Create AnalysisResponse DTO (moved out of controller)

**Files:**
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/AnalysisResponse.java`

- [ ] **Step 1: Write `AnalysisResponse.java`** (mirrors existing fields in `AnalysisApiController.AnalysisResponse`)

```java
package com.sport.web_sport.sports.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResponse {
    private Long id;
    private AnalysisProvider provider;
    private AnalysisStatus status;
    private String summaryText;
    private String tacticalAnalysis;
    private String keyPoint;
    private String errorMessage;
    private LocalDateTime updatedAt;

    @JsonIgnore
    public boolean isEmpty() { return id == null; }

    public static AnalysisResponse from(MatchAnalysis a) {
        if (a == null) return notCreated();
        return AnalysisResponse.builder()
                .id(a.getId())
                .provider(a.getProvider())
                .status(a.getStatus())
                .summaryText(a.getSummaryText())
                .tacticalAnalysis(a.getTacticalAnalysis())
                .keyPoint(a.getKeyPoint())
                .errorMessage(a.getErrorMessage())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    public static AnalysisResponse notCreated() {
        return AnalysisResponse.builder().status(AnalysisStatus.NOT_CREATED).build();
    }
}
```

- [ ] **Step 2: Compile**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/sport/web_sport/sports/dto/response/AnalysisResponse.java
git commit -m "feat(dto): add AnalysisResponse"
```

---

## Task 4: Create FavoriteTeamResponse DTO

**Files:**
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/FavoriteTeamResponse.java`

- [ ] **Step 1: Write the DTO**

```java
package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.favorite.entity.FavoriteTeam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class FavoriteTeamResponse {
    private Long id;
    private SportType sportType;
    private Long teamId;
    private String teamName;
    private TeamResponse team;
    private LocalDateTime createdAt;

    public static FavoriteTeamResponse from(FavoriteTeam favorite) {
        if (favorite == null) return null;
        return FavoriteTeamResponse.builder()
                .id(favorite.getId())
                .sportType(favorite.getSportType())
                .teamId(favorite.getTeam() != null ? favorite.getTeam().getId() : null)
                .teamName(favorite.getTeamName())
                .team(TeamResponse.from(favorite.getTeam()))
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
```

- [ ] **Step 2: Compile**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/sport/web_sport/sports/dto/response/FavoriteTeamResponse.java
git commit -m "feat(dto): add FavoriteTeamResponse"
```

---

## Task 5: Create MatchDetailFullResponse DTO

**Files:**
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/MatchDetailFullResponse.java`

- [ ] **Step 1: Write the DTO**

```java
package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.AnalysisStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class MatchDetailFullResponse {
    private MatchResponse match;
    private TeamResponse homeTeam;
    private TeamResponse awayTeam;
    private LeagueResponse league;
    private List<MatchStatResponse> stats;
    private List<MatchEventResponse> events;
    private AnalysisResponse analysis;
    private AnalysisStatus analysisStatus;
    private boolean homeTeamFavorite;
    private boolean awayTeamFavorite;
    private boolean loggedIn;
}
```

- [ ] **Step 2: Compile**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/sport/web_sport/sports/dto/response/MatchDetailFullResponse.java
git commit -m "feat(dto): add MatchDetailFullResponse"
```

---

## Task 6: Refactor MatchService.findDetailFull to return DTO with favorite/login flags

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/service/MatchService.java`

- [ ] **Step 1: Update imports and add `FavoriteTeamService` dependency**

Replace the existing imports/fields/method `findDetailFull` block. Final relevant sections:

```java
import com.sport.web_sport.favorite.service.FavoriteTeamService;
import com.sport.web_sport.sports.dto.response.AnalysisResponse;
import com.sport.web_sport.sports.dto.response.LeagueResponse;
import com.sport.web_sport.sports.dto.response.MatchDetailFullResponse;
import com.sport.web_sport.sports.dto.response.MatchEventResponse;
import com.sport.web_sport.sports.dto.response.MatchResponse;
import com.sport.web_sport.sports.dto.response.MatchStatResponse;
import com.sport.web_sport.sports.dto.response.TeamResponse;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;

// add to fields:
private final FavoriteTeamService favoriteTeamService;
private final AuthService authService;
```

- [ ] **Step 2: Replace `findDetailFull` method**

```java
public MatchDetailFullResponse findDetailFull(Long matchId, HttpSession session) {
    Match match = findMatchDetail(matchId);
    List<MatchStat> stats = findStatsByMatchId(matchId);
    List<MatchEvent> events = findEventsByMatchId(matchId);
    Optional<MatchAnalysis> saved = analysisService.getSavedAnalysis(matchId, AnalysisProvider.GEMINI);
    MatchAnalysis analysis = saved.orElse(null);
    AnalysisStatus status = analysis != null ? analysis.getStatus() : AnalysisStatus.NOT_CREATED;

    boolean loggedIn = authService.getLoginUserId(session) != null;
    Long homeTeamId = match.getHomeTeam() != null ? match.getHomeTeam().getId() : null;
    Long awayTeamId = match.getAwayTeam() != null ? match.getAwayTeam().getId() : null;
    boolean homeFav = loggedIn && favoriteTeamService.isFavoriteTeam(homeTeamId, session);
    boolean awayFav = loggedIn && favoriteTeamService.isFavoriteTeam(awayTeamId, session);

    return MatchDetailFullResponse.builder()
            .match(MatchResponse.from(match))
            .homeTeam(TeamResponse.from(match.getHomeTeam()))
            .awayTeam(TeamResponse.from(match.getAwayTeam()))
            .league(LeagueResponse.from(match.getLeague()))
            .stats(stats.stream().map(MatchStatResponse::from).toList())
            .events(events.stream().map(MatchEventResponse::from).toList())
            .analysis(analysis != null ? AnalysisResponse.from(analysis) : AnalysisResponse.notCreated())
            .analysisStatus(status)
            .homeTeamFavorite(homeFav)
            .awayTeamFavorite(awayFav)
            .loggedIn(loggedIn)
            .build();
}
```

The old single-arg `findDetailFull(Long)` is removed.

- [ ] **Step 3: Delete obsolete `MatchDetailDto`**

```bash
git rm src/main/java/com/sport/web_sport/sports/dto/MatchDetailDto.java
```

- [ ] **Step 4: Compile (expect controller compile error — fixed in Task 7)**

Run: `./mvnw compile -q`
Expected: FAIL at `MatchApiController` (it still references the old signature) — proceed to Task 7.

---

## Task 7: Refactor MatchApiController to return DTOs

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/controller/MatchApiController.java`

- [ ] **Step 1: Replace the file contents**

```java
package com.sport.web_sport.sports.controller;

import com.sport.web_sport.sports.dto.MatchSearchCondition;
import com.sport.web_sport.sports.dto.response.MatchDetailFullResponse;
import com.sport.web_sport.sports.dto.response.MatchEventResponse;
import com.sport.web_sport.sports.dto.response.MatchResponse;
import com.sport.web_sport.sports.dto.response.MatchStatResponse;
import com.sport.web_sport.sports.service.MatchService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchApiController {

    private final MatchService matchService;

    @GetMapping
    public List<MatchResponse> list(@ModelAttribute MatchSearchCondition condition) {
        return matchService.searchMatches(condition).stream()
                .map(MatchResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public MatchResponse detail(@PathVariable Long id) {
        return MatchResponse.from(matchService.findMatchDetail(id));
    }

    @GetMapping("/{id}/stats")
    public List<MatchStatResponse> stats(@PathVariable Long id) {
        return matchService.findStatsByMatchId(id).stream()
                .map(MatchStatResponse::from)
                .toList();
    }

    @GetMapping("/{id}/events")
    public List<MatchEventResponse> events(@PathVariable Long id) {
        return matchService.findEventsByMatchId(id).stream()
                .map(MatchEventResponse::from)
                .toList();
    }

    @GetMapping("/{id}/detail-full")
    public MatchDetailFullResponse detailFull(@PathVariable Long id, HttpSession session) {
        return matchService.findDetailFull(id, session);
    }
}
```

- [ ] **Step 2: Compile**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/sport/web_sport/sports/service/MatchService.java \
        src/main/java/com/sport/web_sport/sports/controller/MatchApiController.java
git rm src/main/java/com/sport/web_sport/sports/dto/MatchDetailDto.java
git commit -m "feat(api): detail-full returns aggregated DTO with favorite/login flags"
```

---

## Task 8: Refactor SportApiController + SportsService

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/service/SportsService.java`
- Modify: `src/main/java/com/sport/web_sport/sports/controller/SportApiController.java`

- [ ] **Step 1: Add `findAllPlayers()` and `findTeamById` helpers to `SportsService`**

Append inside the class:

```java
public List<Player> findAllPlayers() {
    return playerRepository.findAll();
}
```

- [ ] **Step 2: Replace `SportApiController` contents**

Keep existing nested endpoints AND add the flat endpoints the spec requests.

```java
package com.sport.web_sport.sports.controller;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.dto.response.LeagueResponse;
import com.sport.web_sport.sports.dto.response.TeamResponse;
import com.sport.web_sport.sports.entity.Player;
import com.sport.web_sport.sports.service.SportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class SportApiController {

    private final SportsService sportsService;

    @GetMapping("/api/sports")
    public List<SportType> sports() {
        return Arrays.asList(SportType.values());
    }

    @GetMapping("/api/leagues")
    public List<LeagueResponse> leagues(@RequestParam(required = false) SportType sportType) {
        List<com.sport.web_sport.sports.entity.League> leagues =
                sportType != null ? sportsService.findLeagues(sportType) : sportsService.findAllLeagues();
        return leagues.stream().map(LeagueResponse::from).toList();
    }

    @GetMapping("/api/teams")
    public List<TeamResponse> teams(@RequestParam(required = false) SportType sportType,
                                    @RequestParam(required = false) Long leagueId) {
        List<com.sport.web_sport.sports.entity.Team> teams;
        if (leagueId != null) {
            teams = sportsService.findTeamsByLeague(leagueId);
        } else if (sportType != null) {
            teams = sportsService.findTeams(sportType);
        } else {
            teams = sportsService.findAllTeams();
        }
        return teams.stream().map(TeamResponse::from).toList();
    }

    @GetMapping("/api/players")
    public List<PlayerResponse> players(@RequestParam(required = false) Long teamId) {
        List<Player> players = teamId != null
                ? sportsService.findPlayersByTeam(teamId)
                : sportsService.findAllPlayers();
        return players.stream().map(PlayerResponse::from).toList();
    }

    // Keep existing nested routes for backwards compatibility
    @GetMapping("/api/sports/{sportType}/leagues")
    public List<LeagueResponse> leaguesBySport(@PathVariable SportType sportType) {
        return sportsService.findLeagues(sportType).stream().map(LeagueResponse::from).toList();
    }

    @GetMapping("/api/sports/{sportType}/teams")
    public List<TeamResponse> teamsBySport(@PathVariable SportType sportType) {
        return sportsService.findTeams(sportType).stream().map(TeamResponse::from).toList();
    }

    @GetMapping("/api/sports/teams/{teamId}/players")
    public List<PlayerResponse> playersByTeam(@PathVariable Long teamId) {
        return sportsService.findPlayersByTeam(teamId).stream().map(PlayerResponse::from).toList();
    }

    // Tiny inline DTO — Player is only used here
    public record PlayerResponse(Long id, SportType sportType, Long teamId, String teamName,
                                 String playerName, Integer backNumber, String position, String nickname) {
        static PlayerResponse from(Player p) {
            return new PlayerResponse(
                    p.getId(),
                    p.getSportType(),
                    p.getTeam() != null ? p.getTeam().getId() : null,
                    p.getTeam() != null ? p.getTeam().getTeamName() : null,
                    p.getPlayerName(),
                    p.getBackNumber(),
                    p.getPosition(),
                    p.getNickname()
            );
        }
    }
}
```

- [ ] **Step 3: Compile**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add src/main/java/com/sport/web_sport/sports/service/SportsService.java \
        src/main/java/com/sport/web_sport/sports/controller/SportApiController.java
git commit -m "feat(api): SportApiController returns DTOs and adds flat endpoints"
```

---

## Task 9: Refactor FavoriteApiController to return DTOs

**Files:**
- Modify: `src/main/java/com/sport/web_sport/favorite/controller/FavoriteApiController.java`

- [ ] **Step 1: Replace the file contents**

```java
package com.sport.web_sport.favorite.controller;

import com.sport.web_sport.favorite.entity.FavoriteTeam;
import com.sport.web_sport.favorite.service.FavoriteTeamService;
import com.sport.web_sport.sports.dto.response.FavoriteTeamResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteApiController {

    private final FavoriteTeamService favoriteTeamService;

    @GetMapping
    public List<FavoriteTeamResponse> list(HttpSession session) {
        return favoriteTeamService.getFavorites(session).stream()
                .map(FavoriteTeamResponse::from)
                .toList();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> add(@RequestParam Long teamId, HttpSession session) {
        FavoriteTeam saved = favoriteTeamService.addFavorite(teamId, session);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "favorite", FavoriteTeamResponse.from(saved)
        ));
    }

    @DeleteMapping("/{favoriteId}")
    public ResponseEntity<Map<String, Object>> remove(@PathVariable Long favoriteId, HttpSession session) {
        favoriteTeamService.removeFavorite(favoriteId, session);
        return ResponseEntity.ok(Map.of("success", true, "favoriteId", favoriteId));
    }
}
```

- [ ] **Step 2: Compile**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/sport/web_sport/favorite/controller/FavoriteApiController.java
git commit -m "feat(api): FavoriteApiController returns DTOs"
```

---

## Task 10: Refactor AnalysisApiController to use shared AnalysisResponse

**Files:**
- Modify: `src/main/java/com/sport/web_sport/analysis/controller/AnalysisApiController.java`

- [ ] **Step 1: Replace inner `AnalysisResponse` usage with the shared DTO**

```java
package com.sport.web_sport.analysis.controller;

import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.analysis.service.AnalysisService;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.sports.dto.response.AnalysisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AnalysisApiController {

    private final AnalysisService analysisService;

    @GetMapping("/api/matches/{matchId}/analysis")
    public ResponseEntity<AnalysisResponse> getMatchAnalysis(
            @PathVariable Long matchId,
            @RequestParam(defaultValue = "GEMINI") AnalysisProvider provider) {
        return analysisService.getSavedAnalysis(matchId, provider)
                .map(a -> ResponseEntity.ok(AnalysisResponse.from(a)))
                .orElseGet(() -> ResponseEntity.ok(AnalysisResponse.notCreated()));
    }

    @PostMapping("/api/matches/{matchId}/analysis/generate")
    public AnalysisResponse generate(@PathVariable Long matchId) {
        return AnalysisResponse.from(analysisService.generateGeminiAnalysis(matchId));
    }

    @PostMapping("/api/matches/{matchId}/analysis/regenerate")
    public AnalysisResponse regenerate(@PathVariable Long matchId) {
        return AnalysisResponse.from(analysisService.regenerateGeminiAnalysis(matchId));
    }

    @GetMapping("/api/analysis/match/{matchId}")
    public ResponseEntity<MatchAnalysis> getLegacy(@PathVariable Long matchId,
                                                   @RequestParam(defaultValue = "MOCK") AnalysisProvider provider) {
        return analysisService.getAnalysis(matchId, provider)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/api/analysis/match/{matchId}/mock")
    public MatchAnalysis createMock(@PathVariable Long matchId) {
        return analysisService.createMockAnalysis(matchId);
    }
}
```

The inner static class is gone.

- [ ] **Step 2: Compile**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/sport/web_sport/analysis/controller/AnalysisApiController.java
git commit -m "refactor(analysis): use shared AnalysisResponse DTO"
```

---

## Task 11: Verify page controllers still compile and run full build

**Files:**
- Read: `src/main/java/com/sport/web_sport/sports/controller/MatchPageController.java`
- Read: `src/main/java/com/sport/web_sport/sports/controller/SportPageController.java`
- Read: `src/main/java/com/sport/web_sport/favorite/controller/FavoritePageController.java`

- [ ] **Step 1: Grep for stale references**

Run: `grep -rn "MatchDetailDto" src/main/java` — Expected: no matches.
Run: `grep -rn "AnalysisApiController.AnalysisResponse" src/main/java src/main/resources` — Expected: no matches.

If a page controller references `MatchDetailDto` or the inner `AnalysisResponse`, update it to use the new types (`MatchDetailFullResponse`, `AnalysisResponse`).

- [ ] **Step 2: Full build**

Run: `./mvnw clean compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Smoke test (manual)**

Run: `./mvnw spring-boot:run`
Then hit (in another shell):
- `curl http://localhost:8080/api/matches | head -c 500` — JSON list of MatchResponse, no `homeTeamPlayers`/lazy proxies.
- `curl http://localhost:8080/api/matches/1/detail-full` — single aggregated payload with `loggedIn=false`, `homeTeamFavorite=false`, `analysisStatus` present.

- [ ] **Step 4: Commit any page-controller fixes**

```bash
git add -A
git commit -m "fix: align page controllers with new DTO types"
```

(Skip this step if nothing changed.)

---

## Self-Review Checklist

- Spec §1 detail-full aggregated payload → Tasks 5, 6, 7.
- Spec §1 no Gemini call → `findDetailFull` uses only `getSavedAnalysis` (Task 6).
- Spec §1 NOT_CREATED status when absent → Task 6 sets `AnalysisStatus.NOT_CREATED`.
- Spec §1 favorite flags false when not logged in → Task 6 gates with `loggedIn`.
- Spec §2 all 8 DTOs → Tasks 1-5 (`MatchResponse`, `MatchDetailFullResponse`, `TeamResponse`, `LeagueResponse`, `MatchStatResponse`, `MatchEventResponse`, `AnalysisResponse`, `FavoriteTeamResponse`) + Task 8 adds `PlayerResponse` as a record (not required by spec but needed for `/api/players`).
- Spec §3 MatchApiController endpoints (list/detail/stats/events/detail-full) → Task 7 covers all five.
- Spec §4 SportApiController flat endpoints → Task 8.
- Spec §5 FavoriteApiController → Task 9.
- Spec §6 AnalysisApiController → Task 10. GET reads only, generate uses cached DONE, regenerate forces (existing `AnalysisService` already implements this — preserved).
- Spec §7 helpers added only when needed → `findAllPlayers()` only.
- Spec §8 project compiles → Task 11 full build.
- Don't-do list (no React, no Spring Security, keep Gemini, keep search/filter, keep sample data, no heavy CSS) → respected; no edits to those areas.
