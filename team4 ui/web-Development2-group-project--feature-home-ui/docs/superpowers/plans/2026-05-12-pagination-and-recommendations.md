# Pagination, Sorting, Favorite Recommendations & API Test Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add page/size/sort to the match search (page UI + JSON API), surface matches involving a user's favorite teams on the home page, add a developer-friendly `/api-test` page that links every JSON endpoint, and move `PlayerResponse` to the DTO package.

**Architecture:** Extend `MatchSearchCondition` with `page`, `size`, `sort` fields. Add a paginated repository query that drives sort via JPQL `CASE WHEN` (needed for `liveFirst` ordering — `Sort.by` can't express that). Service returns `Page<Match>`. New `PageResponse<T>` DTO wraps the API payload. Template gains prev/next/sort/size controls. Home page picks up a new "내 관심 팀 경기" section fed by a new service method that quietly returns an empty list when not logged in. `/api-test` is a static-content Thymeleaf page rendered by a tiny controller route.

**Tech Stack:** Spring Boot 3.5.14, Java 17, Thymeleaf, JPA, Oracle, Lombok.

**Sort handling notes:** Three options: `latest` (default), `oldest`, `liveFirst`. `latest`/`oldest` map cleanly to Spring `Sort` but `liveFirst` needs `ORDER BY CASE WHEN m.status='LIVE' THEN 0 ELSE 1 END, m.matchDate DESC`. We add **two** repository methods (one with a `Pageable` for the simple sorts; one with explicit ordering for `liveFirst`) and pick based on the value.

---

## File Structure

**Create:**
- `src/main/java/com/sport/web_sport/sports/dto/response/PlayerResponse.java`
- `src/main/java/com/sport/web_sport/sports/dto/response/PageResponse.java`
- `src/main/resources/templates/api-test.html`

**Modify:**
- `src/main/java/com/sport/web_sport/sports/dto/MatchSearchCondition.java` — add page/size/sort
- `src/main/java/com/sport/web_sport/sports/repository/MatchRepository.java` — paginated query + liveFirst variant
- `src/main/java/com/sport/web_sport/sports/service/MatchService.java` — `searchMatchesPaged(...)`, `findMatchesByFavoriteTeams(HttpSession)`
- `src/main/java/com/sport/web_sport/sports/controller/MatchApiController.java` — return PageResponse
- `src/main/java/com/sport/web_sport/sports/controller/MatchPageController.java` — pass page object + sort/size
- `src/main/java/com/sport/web_sport/sports/controller/SportApiController.java` — drop inner PlayerResponse, import from DTO package
- `src/main/java/com/sport/web_sport/user/controller/HomeController.java` — add favorite recommendations
- `src/main/resources/templates/matches/list.html` — pagination + sort/size controls
- `src/main/resources/templates/index.html` — recommendation section
- `README.md` — pagination examples, api-test, favorite recommendations

**Add controller route (in existing class):**
- `HomeController.@GetMapping("/api-test")` returning view `"api-test"`

---

## Task 1: Move PlayerResponse to its own DTO file

**Files:**
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/PlayerResponse.java`
- Modify: `src/main/java/com/sport/web_sport/sports/controller/SportApiController.java`

- [ ] **Step 1: Create `PlayerResponse.java`**

```java
package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Player;

public record PlayerResponse(Long id, SportType sportType, Long teamId, String teamName,
                             String playerName, Integer backNumber, String position, String nickname) {
    public static PlayerResponse from(Player p) {
        if (p == null) return null;
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
```

- [ ] **Step 2: Update `SportApiController.java`**

Delete the inner `PlayerResponse` record (lines 75-89) and add the import:
```java
import com.sport.web_sport.sports.dto.response.PlayerResponse;
```

Update the two factory call sites:
- `players.stream().map(PlayerResponse::from).toList();` — already references `PlayerResponse::from`, just needs the import. No body change.

Remove the obsolete unused entity imports if any (the `Player` import remains since the method body uses `List<Player>`).

- [ ] **Step 3: Build + commit**

```
./mvnw compile -q
git add src/main/java/com/sport/web_sport/sports/dto/response/PlayerResponse.java \
        src/main/java/com/sport/web_sport/sports/controller/SportApiController.java
git commit -m "refactor(dto): move PlayerResponse to dto.response package"
```

---

## Task 2: Create `PageResponse<T>` envelope DTO

**Files:**
- Create: `src/main/java/com/sport/web_sport/sports/dto/response/PageResponse.java`

- [ ] **Step 1: Write the DTO**

```java
package com.sport.web_sport.sports.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

@Getter
@Builder
@AllArgsConstructor
public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return PageResponse.<T>builder()
                .content(page.getContent().stream().map(mapper).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
```

- [ ] **Step 2: Build + commit**

```
./mvnw compile -q
git add src/main/java/com/sport/web_sport/sports/dto/response/PageResponse.java
git commit -m "feat(dto): add PageResponse envelope"
```

---

## Task 3: Add page/size/sort fields to `MatchSearchCondition`

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/dto/MatchSearchCondition.java`

- [ ] **Step 1: Replace file contents**

```java
package com.sport.web_sport.sports.dto;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class MatchSearchCondition {

    private SportType sportType;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate date;

    private Integer year;
    private Integer month;
    private MatchStatus status;
    private Long teamId;
    private Long leagueId;
    private String keyword;

    // Pagination + sorting (set via query params or defaults)
    private Integer page = 0;
    private Integer size = 20;
    private String sort = "latest"; // latest | oldest | liveFirst

    public int getPageOrDefault() { return page == null || page < 0 ? 0 : page; }
    public int getSizeOrDefault() {
        if (size == null || size < 1) return 20;
        if (size > 100) return 100;
        return size;
    }
    public String getSortOrDefault() {
        if (sort == null) return "latest";
        return switch (sort) {
            case "oldest", "liveFirst", "latest" -> sort;
            default -> "latest";
        };
    }
}
```

- [ ] **Step 2: Build + commit**

```
./mvnw compile -q
git add src/main/java/com/sport/web_sport/sports/dto/MatchSearchCondition.java
git commit -m "feat(dto): MatchSearchCondition supports page/size/sort"
```

---

## Task 4: Add paginated repository queries

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/repository/MatchRepository.java`

- [ ] **Step 1: Add two new methods next to existing `searchMatches`**

```java
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
        join fetch m.homeTeam ht
        join fetch m.awayTeam at
        join fetch m.league l
        where (ht.id in :teamIds or at.id in :teamIds)
        order by m.matchDate desc
        """)
List<Match> findMatchesByTeamIds(@Param("teamIds") List<Long> teamIds, Pageable pageable);
```

The third method drives the favorite-team recommendation (Task 7).

- [ ] **Step 2: Build + commit**

```
./mvnw compile -q
git add src/main/java/com/sport/web_sport/sports/repository/MatchRepository.java
git commit -m "feat(repo): add paginated and live-first match queries"
```

---

## Task 5: Update `MatchService` with paged search + favorites lookup

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/service/MatchService.java`

- [ ] **Step 1: Add imports**

```java
import com.sport.web_sport.favorite.service.FavoriteTeamService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Collections;
```

Inject `FavoriteTeamService` is already present (added in earlier work). If not, add `private final FavoriteTeamService favoriteTeamService;` — but verify by reading first.

- [ ] **Step 2: Add `searchMatchesPaged(...)` method**

```java
public Page<Match> searchMatchesPaged(MatchSearchCondition condition) {
    LocalDateTime start = null;
    LocalDateTime end = null;

    if (condition.getDate() != null) {
        LocalDate d = condition.getDate();
        start = d.atStartOfDay();
        end = d.plusDays(1).atStartOfDay();
    } else if (condition.getYear() != null && condition.getMonth() != null) {
        YearMonth ym = YearMonth.of(condition.getYear(), condition.getMonth());
        start = ym.atDay(1).atStartOfDay();
        end = ym.plusMonths(1).atDay(1).atStartOfDay();
    }

    String keyword = condition.getKeyword();
    if (keyword != null && keyword.isBlank()) keyword = null;

    int page = condition.getPageOrDefault();
    int size = condition.getSizeOrDefault();
    String sort = condition.getSortOrDefault();

    if ("liveFirst".equals(sort)) {
        Pageable pageable = PageRequest.of(page, size);
        return matchRepository.searchMatchesLiveFirst(
                condition.getSportType(), condition.getStatus(),
                condition.getLeagueId(), condition.getTeamId(),
                start, end, keyword, pageable);
    }

    Sort springSort = "oldest".equals(sort)
            ? Sort.by("matchDate").ascending()
            : Sort.by("matchDate").descending();
    Pageable pageable = PageRequest.of(page, size, springSort);
    return matchRepository.searchMatchesPaged(
            condition.getSportType(), condition.getStatus(),
            condition.getLeagueId(), condition.getTeamId(),
            start, end, keyword, pageable);
}
```

Keep the existing `searchMatches(condition) -> List<Match>` method for backwards compatibility with anything still calling it (the home page recent-matches uses a different method; the page controller and API will switch to the paged variant).

- [ ] **Step 3: Add `findMatchesByFavoriteTeams(HttpSession)` method**

```java
public List<Match> findMatchesByFavoriteTeams(HttpSession session) {
    List<Long> teamIds = favoriteTeamService.getFavoriteTeamIds(session);
    if (teamIds == null || teamIds.isEmpty()) return Collections.emptyList();
    return matchRepository.findMatchesByTeamIds(teamIds, PageRequest.of(0, 10));
}
```

`favoriteTeamService.getFavoriteTeamIds(HttpSession)` already exists and returns empty list when user not logged in — verified earlier.

- [ ] **Step 4: Build + commit**

```
./mvnw compile -q
git add src/main/java/com/sport/web_sport/sports/service/MatchService.java
git commit -m "feat(service): add paged match search and favorite-team match lookup"
```

---

## Task 6: Update `MatchApiController` GET /api/matches to return `PageResponse`

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/controller/MatchApiController.java`

- [ ] **Step 1: Add imports and update the `list` method**

```java
import com.sport.web_sport.sports.dto.response.PageResponse;
import com.sport.web_sport.sports.entity.Match;
import org.springframework.data.domain.Page;
```

Replace the existing `list(...)` method with:

```java
@GetMapping
public PageResponse<MatchResponse> list(@ModelAttribute MatchSearchCondition condition) {
    Page<Match> page = matchService.searchMatchesPaged(condition);
    return PageResponse.of(page, MatchResponse::from);
}
```

All other endpoints (`/{id}`, `/{id}/stats`, `/{id}/events`, `/{id}/detail-full`) remain unchanged.

- [ ] **Step 2: Build + commit**

```
./mvnw compile -q
git add src/main/java/com/sport/web_sport/sports/controller/MatchApiController.java
git commit -m "feat(api): GET /api/matches returns PageResponse with page/size/sort"
```

---

## Task 7: Update `MatchPageController` and `matches/list.html`

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/controller/MatchPageController.java`
- Modify: `src/main/resources/templates/matches/list.html`

- [ ] **Step 1: Update controller's `list(...)`**

```java
@GetMapping
public String list(@ModelAttribute("condition") MatchSearchCondition condition, Model model) {
    Page<Match> page = matchService.searchMatchesPaged(condition);
    model.addAttribute("matchesPage", page);
    model.addAttribute("matches", page.getContent());
    model.addAttribute("sports", SportType.values());
    model.addAttribute("statuses", MatchStatus.values());
    model.addAttribute("leagues", sportsService.findAllLeagues());
    model.addAttribute("teams", sportsService.findAllTeams());
    return "matches/list";
}
```

Add imports for `Page` (`org.springframework.data.domain.Page`) and `Match` (`com.sport.web_sport.sports.entity.Match`).

- [ ] **Step 2: Replace `matches/list.html`**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{fragments/header :: head('경기 목록')}"></head>
<body>
<nav th:replace="~{fragments/nav :: nav}"></nav>
<main>
    <h1>경기 목록</h1>

    <form th:action="@{/matches}" method="get">
        <label>종목
            <select name="sportType">
                <option value="">전체</option>
                <option th:each="s : ${sports}" th:value="${s}" th:text="${s}"
                        th:selected="${condition.sportType != null and condition.sportType == s}">SPORT</option>
            </select>
        </label>

        <label>날짜 <input type="date" name="date" th:value="${condition.date}"></label>
        <label>연도 <input type="number" name="year" th:value="${condition.year}" min="1900" max="2100"></label>
        <label>월 <input type="number" name="month" th:value="${condition.month}" min="1" max="12"></label>

        <label>상태
            <select name="status">
                <option value="">전체</option>
                <option th:each="st : ${statuses}" th:value="${st}" th:text="${st}"
                        th:selected="${condition.status != null and condition.status == st}">STATUS</option>
            </select>
        </label>

        <label>리그
            <select name="leagueId">
                <option value="">전체</option>
                <option th:each="l : ${leagues}" th:value="${l.id}" th:text="${l.leagueName}"
                        th:selected="${condition.leagueId != null and condition.leagueId == l.id}">LEAGUE</option>
            </select>
        </label>

        <label>팀
            <select name="teamId">
                <option value="">전체</option>
                <option th:each="t : ${teams}" th:value="${t.id}" th:text="${t.teamName}"
                        th:selected="${condition.teamId != null and condition.teamId == t.id}">TEAM</option>
            </select>
        </label>

        <label>검색어 <input type="text" name="keyword" th:value="${condition.keyword}" placeholder="팀/리그/경기장"></label>

        <label>정렬
            <select name="sort">
                <option value="latest"    th:selected="${condition.sort == 'latest' or condition.sort == null}">최신순</option>
                <option value="oldest"    th:selected="${condition.sort == 'oldest'}">오래된순</option>
                <option value="liveFirst" th:selected="${condition.sort == 'liveFirst'}">LIVE 먼저</option>
            </select>
        </label>

        <label>개수
            <select name="size">
                <option value="10" th:selected="${condition.size == 10}">10</option>
                <option value="20" th:selected="${condition.size == 20 or condition.size == null}">20</option>
                <option value="50" th:selected="${condition.size == 50}">50</option>
                <option value="100" th:selected="${condition.size == 100}">100</option>
            </select>
        </label>

        <input type="hidden" name="page" value="0">
        <button type="submit">검색</button>
        <a th:href="@{/matches}">초기화</a>
    </form>

    <table>
        <thead>
        <tr>
            <th>종목</th><th>리그</th><th>경기일</th><th>홈</th><th>스코어</th><th>원정</th><th>상태</th>
        </tr>
        </thead>
        <tbody>
        <tr th:each="m : ${matches}">
            <td th:text="${m.sportType}">SPORT</td>
            <td th:text="${m.league?.leagueName}">LEAGUE</td>
            <td th:text="${m.matchDate}">DATE</td>
            <td th:text="${m.homeTeam?.teamName}">HOME</td>
            <td>
                <a th:href="@{|/matches/${m.id}|}">
                    <span th:text="${m.homeScore} ?: '-'">-</span> :
                    <span th:text="${m.awayScore} ?: '-'">-</span>
                </a>
            </td>
            <td th:text="${m.awayTeam?.teamName}">AWAY</td>
            <td th:text="${m.status}">STATUS</td>
        </tr>
        </tbody>
    </table>

    <div class="pagination">
        <span>
            페이지 <strong th:text="${matchesPage.number + 1}">1</strong> /
            <span th:text="${matchesPage.totalPages == 0 ? 1 : matchesPage.totalPages}">1</span>
            (총 <span th:text="${matchesPage.totalElements}">0</span>건)
        </span>

        <form th:action="@{/matches}" method="get" style="display:inline">
            <input type="hidden" name="sportType" th:value="${condition.sportType}">
            <input type="hidden" name="date"      th:value="${condition.date}">
            <input type="hidden" name="year"      th:value="${condition.year}">
            <input type="hidden" name="month"     th:value="${condition.month}">
            <input type="hidden" name="status"    th:value="${condition.status}">
            <input type="hidden" name="leagueId"  th:value="${condition.leagueId}">
            <input type="hidden" name="teamId"    th:value="${condition.teamId}">
            <input type="hidden" name="keyword"   th:value="${condition.keyword}">
            <input type="hidden" name="sort"      th:value="${condition.sort}">
            <input type="hidden" name="size"      th:value="${condition.size}">
            <input type="hidden" name="page"      th:value="${matchesPage.number - 1}">
            <button type="submit" th:disabled="${!matchesPage.hasPrevious()}">이전</button>
        </form>

        <form th:action="@{/matches}" method="get" style="display:inline">
            <input type="hidden" name="sportType" th:value="${condition.sportType}">
            <input type="hidden" name="date"      th:value="${condition.date}">
            <input type="hidden" name="year"      th:value="${condition.year}">
            <input type="hidden" name="month"     th:value="${condition.month}">
            <input type="hidden" name="status"    th:value="${condition.status}">
            <input type="hidden" name="leagueId"  th:value="${condition.leagueId}">
            <input type="hidden" name="teamId"    th:value="${condition.teamId}">
            <input type="hidden" name="keyword"   th:value="${condition.keyword}">
            <input type="hidden" name="sort"      th:value="${condition.sort}">
            <input type="hidden" name="size"      th:value="${condition.size}">
            <input type="hidden" name="page"      th:value="${matchesPage.number + 1}">
            <button type="submit" th:disabled="${!matchesPage.hasNext()}">다음</button>
        </form>
    </div>

    <p><a th:href="@{/}">홈으로</a></p>
</main>
<footer th:replace="~{fragments/footer :: footer}"></footer>
</body>
</html>
```

- [ ] **Step 3: Build + commit**

```
./mvnw compile -q
git add src/main/java/com/sport/web_sport/sports/controller/MatchPageController.java \
        src/main/resources/templates/matches/list.html
git commit -m "feat(page): /matches pagination, sort and size controls"
```

---

## Task 8: Home page favorite-team recommendations

**Files:**
- Modify: `src/main/java/com/sport/web_sport/user/controller/HomeController.java`
- Modify: `src/main/resources/templates/index.html`

- [ ] **Step 1: Update `HomeController`**

```java
package com.sport.web_sport.user.controller;

import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.service.MatchService;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final MatchRepository matchRepository;
    private final MatchService matchService;
    private final AuthService authService;

    @GetMapping("/")
    public String index(Model model, HttpSession session) {
        List<Match> recent = matchRepository.findTop10WithTeams(PageRequest.of(0, 10));
        model.addAttribute("recentMatches", recent);
        model.addAttribute("loginUsername", session.getAttribute(AuthService.SESSION_USERNAME));

        boolean loggedIn = authService.getLoginUserId(session) != null;
        model.addAttribute("loggedIn", loggedIn);
        model.addAttribute("favoriteMatches",
                loggedIn ? matchService.findMatchesByFavoriteTeams(session) : List.of());
        return "index";
    }

    @GetMapping("/api-test")
    public String apiTest() {
        return "api-test";
    }
}
```

- [ ] **Step 2: Update `templates/index.html`**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{fragments/header :: head('Sport Analysis')}"></head>
<body>
<nav th:replace="~{fragments/nav :: nav}"></nav>
<main>
    <h1>스포츠 분석</h1>

    <section>
        <h2>내 관심 팀 경기</h2>
        <div th:if="${!loggedIn}">
            <p>로그인하면 관심 팀 경기 추천을 볼 수 있습니다.</p>
        </div>
        <div th:if="${loggedIn}">
            <p th:if="${#lists.isEmpty(favoriteMatches)}">즐겨찾기한 팀의 경기가 없습니다.</p>
            <ul th:unless="${#lists.isEmpty(favoriteMatches)}">
                <li th:each="m : ${favoriteMatches}">
                    <a th:href="@{|/matches/${m.id}|}">
                        <span th:text="${m.sportType}">SPORT</span> |
                        <span th:text="${m.homeTeam?.teamName}">Home</span>
                        <span th:text="${m.homeScore} ?: '-'">-</span> :
                        <span th:text="${m.awayScore} ?: '-'">-</span>
                        <span th:text="${m.awayTeam?.teamName}">Away</span>
                        (<span th:text="${m.status}">STATUS</span>)
                    </a>
                </li>
            </ul>
        </div>
    </section>

    <h2>최근 경기</h2>
    <ul>
        <li th:each="m : ${recentMatches}">
            <a th:href="@{|/matches/${m.id}|}">
                <span th:text="${m.sportType}">SPORT</span> |
                <span th:text="${m.homeTeam?.teamName}">Home</span>
                <span th:text="${m.homeScore} ?: '-'">-</span> :
                <span th:text="${m.awayScore} ?: '-'">-</span>
                <span th:text="${m.awayTeam?.teamName}">Away</span>
                (<span th:text="${m.status}">STATUS</span>)
            </a>
        </li>
    </ul>
</main>
<footer th:replace="~{fragments/footer :: footer}"></footer>
</body>
</html>
```

- [ ] **Step 3: Build + commit**

```
./mvnw compile -q
git add src/main/java/com/sport/web_sport/user/controller/HomeController.java \
        src/main/resources/templates/index.html
git commit -m "feat(home): favorite-team match recommendations + /api-test route"
```

---

## Task 9: Create the `/api-test` template

**Files:**
- Create: `src/main/resources/templates/api-test.html`

(The controller route was added in Task 8.)

- [ ] **Step 1: Write the template**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{fragments/header :: head('API Test')}"></head>
<body>
<nav th:replace="~{fragments/nav :: nav}"></nav>
<main>
    <h1>API Test</h1>
    <p>각 링크를 클릭하면 JSON 응답을 직접 확인할 수 있습니다.</p>
    <ul>
        <li><a th:href="@{/api/sports}">/api/sports</a></li>
        <li><a th:href="@{/api/leagues}">/api/leagues</a></li>
        <li><a th:href="@{/api/teams}">/api/teams</a></li>
        <li><a th:href="@{/api/players}">/api/players</a></li>
        <li><a th:href="@{/api/matches}">/api/matches</a></li>
        <li><a th:href="@{/api/matches?page=0&size=5&sort=liveFirst}">/api/matches?page=0&amp;size=5&amp;sort=liveFirst</a></li>
        <li><a th:href="@{/api/matches/1}">/api/matches/1</a></li>
        <li><a th:href="@{/api/matches/1/stats}">/api/matches/1/stats</a></li>
        <li><a th:href="@{/api/matches/1/events}">/api/matches/1/events</a></li>
        <li><a th:href="@{/api/matches/1/detail-full}">/api/matches/1/detail-full</a></li>
        <li><a th:href="@{/api/matches/1/analysis}">/api/matches/1/analysis</a></li>
        <li><a th:href="@{/api/favorites}">/api/favorites (로그인 필요)</a></li>
    </ul>
</main>
<footer th:replace="~{fragments/footer :: footer}"></footer>
</body>
</html>
```

- [ ] **Step 2: Build + commit**

```
./mvnw compile -q
git add src/main/resources/templates/api-test.html
git commit -m "feat(page): add /api-test template"
```

---

## Task 10: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Insert under the existing "API" section a new "Pagination & sorting" subsection, and a "Pages" subsection. Add `/api-test` and home recommendation to the Features list.**

Add to the Features list (after "팀 즐겨찾기 추가/삭제"):
```
- 홈 화면 관심 팀 경기 추천 (로그인 시)
- `/api-test` 페이지에서 모든 JSON API 빠른 점검
- 경기 목록 페이지네이션 및 정렬 (page/size/sort)
```

Replace the "API" section's intro paragraph with the existing one plus this block right after the table:

```markdown
### Pagination & sorting

`GET /api/matches` supports query parameters:

| Param | Default | Values |
|---|---|---|
| `page` | 0 | 0-based page index |
| `size` | 20 | 1-100 |
| `sort` | `latest` | `latest`, `oldest`, `liveFirst` |

`/api/matches`는 다음 형태의 JSON을 반환합니다:

```json
{
  "content": [ /* MatchResponse[] */ ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3,
  "hasNext": true,
  "hasPrevious": false
}
```

예시:
- `GET /api/matches?sort=liveFirst&size=5`
- `GET /api/matches?sportType=SOCCER&page=1&size=10`

### Pages

| Path | Description |
|---|---|
| `/` | 홈 (최근 경기 + 로그인 시 관심 팀 경기) |
| `/matches` | 경기 목록 (필터 + 페이지네이션 + 정렬) |
| `/matches/{id}` | 경기 상세 (스탯·이벤트·즐겨찾기·AI 분석) |
| `/sports/{soccer\|baseball\|esports}` | 종목별 리그·팀 |
| `/favorites` | 즐겨찾기 (로그인 필요) |
| `/login`, `/register` | 인증 |
| `/api-test` | 모든 JSON 엔드포인트 빠른 점검 페이지 |
```

- [ ] **Step 2: Commit**

```
git add README.md
git commit -m "docs: add pagination examples, /api-test, home recommendations"
```

---

## Task 11: Final clean build + smoke test

- [ ] **Step 1: Clean build**

Run: `./mvnw clean compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 2: Smoke test**

Start app (`./mvnw spring-boot:run` in background), then run:

```bash
curl -s "http://localhost:8080/api/matches?page=0&size=2&sort=liveFirst" | python -c "import sys, json; d=json.load(sys.stdin); print({k:(len(v) if isinstance(v,list) else v) for k,v in d.items()})"

curl -s -o /tmp/p.html -w "HTTP %{http_code}\n" http://localhost:8080/api-test
grep -c "<a " /tmp/p.html  # expect 12+ links

curl -s -o /tmp/h.html -w "HTTP %{http_code}\n" http://localhost:8080/
grep "관심 팀" /tmp/h.html | head -2
```

Expected: page envelope with `content`, `page=0`, `size=2`, `totalElements>0`, `hasNext` boolean. `/api-test` returns 200 and contains all link items. Home page shows "내 관심 팀 경기" section.

Kill app afterwards.

---

## Self-Review Checklist

- Spec §1 pagination + sort applied to `/matches` and `/api/matches`, all filter params preserved (Tasks 3-7).
- Spec §1 sort options: latest / oldest / liveFirst (Task 4 has dedicated query for liveFirst, Task 5 routes by sort string).
- Spec §1 API page envelope: content/page/size/totalElements/totalPages/hasNext/hasPrevious — Task 2 (`PageResponse`).
- Spec §1 Thymeleaf controls: current page, prev/next, sort/size selects — Task 7.
- Spec §2 PlayerResponse moved to DTO file — Task 1.
- Spec §3 favorite recommendations on home, empty-list-when-not-logged-in semantics — Task 5 (`findMatchesByFavoriteTeams`) + Task 8.
- Spec §4 `/api-test` GET route + template with required links — Tasks 8 (route) + 9 (template).
- Spec §5 README — Task 10.
- Spec §6 keep compiling — Task 11.
- Don't-do: no Spring Security, no React, no auth/CSRF changes, no Gemini removal, no DTO removal, no heavy CSS.
