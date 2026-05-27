# MLB Phase 2B — Horizontal Carousel Match Sections

**Date:** 2026-05-19
**Branch:** BASEBALL
**Depends on:** MLB Phase 2A (MatchSections component, GET /api/matches/sections)
**Status:** Approved

---

## Goal

1. Add `leagueName` filtering to `GET /api/matches/sections` so MLB sections exclude KBO/sample baseball matches.
2. Redesign `MatchSections` from a vertical grid into a horizontal carousel strip with left/right arrow navigation (1 card per click, native scroll).
3. Add a `compact` prop to `MatchCard` for narrower carousel cards (220 px wide, all content retained).
4. On `MatchListPage`, pass `leagueName="MLB"` when the sport filter is BASEBALL so the top panel shows MLB games only.

## Out of Scope

- Player statistics
- Strike zone
- News / articles
- Live play-by-play
- Pre-match AI prediction
- Git commit (user reviews first)

---

## Architecture

Five independent changes that share no state:

1. `MatchRepository` — both section queries gain an optional `leagueName` param.
2. `MatchService.findMatchSections` — signature extends to `(SportType, String)`.
3. `MatchApiController` — sections endpoint gains `leagueName` query param.
4. `MatchCard.jsx` — `compact` prop adds `.match-card-compact` class; existing usage unchanged.
5. `MatchSections.jsx` — each section replaced by a `CarouselRow` with native overflow scroll and arrow buttons.
6. `MatchListPage.jsx` — passes `leagueName="MLB"` when `form.sportType === "BASEBALL"`.
7. `components.css` — new carousel and compact-card classes.

---

## Backend

### 1. MatchRepository — add `leagueName` param

Modify both existing queries in `MatchRepository`:

**`findTopByStatusDesc`** — add filter line and param:

```java
@Query("""
        select m from Match m
        join fetch m.homeTeam
        join fetch m.awayTeam
        join fetch m.league
        where (:sportType is null or m.sportType = :sportType)
          and (:leagueName is null or m.league.leagueName = :leagueName)
          and m.status = :status
        order by m.matchDate desc
        """)
List<Match> findTopByStatusDesc(@Param("sportType") SportType sportType,
                                @Param("leagueName") String leagueName,
                                @Param("status") MatchStatus status,
                                Pageable pageable);
```

**`findTopByStatusAsc`** — same addition:

```java
@Query("""
        select m from Match m
        join fetch m.homeTeam
        join fetch m.awayTeam
        join fetch m.league
        where (:sportType is null or m.sportType = :sportType)
          and (:leagueName is null or m.league.leagueName = :leagueName)
          and m.status = :status
        order by m.matchDate asc
        """)
List<Match> findTopByStatusAsc(@Param("sportType") SportType sportType,
                               @Param("leagueName") String leagueName,
                               @Param("status") MatchStatus status,
                               Pageable pageable);
```

`leagueName` is nullable — null means no league filter.

---

### 2. MatchService — extend `findMatchSections`

Change signature and all three repository calls:

```java
public MatchSectionsResponse findMatchSections(SportType sportType, String leagueName) {
    Pageable top6 = PageRequest.of(0, 6);

    List<MatchResponse> live = matchRepository
            .findTopByStatusDesc(sportType, leagueName, MatchStatus.LIVE, top6)
            .stream().map(MatchResponse::from).toList();

    List<MatchResponse> recent = matchRepository
            .findTopByStatusDesc(sportType, leagueName, MatchStatus.FINAL, top6)
            .stream().map(MatchResponse::from).toList();

    List<MatchResponse> upcoming = matchRepository
            .findTopByStatusAsc(sportType, leagueName, MatchStatus.SCHEDULED, top6)
            .stream().map(MatchResponse::from).toList();

    return MatchSectionsResponse.builder()
            .liveMatches(live)
            .recentFinishedMatches(recent)
            .upcomingMatches(upcoming)
            .build();
}
```

---

### 3. MatchApiController — add `leagueName` query param

```java
@GetMapping("/sections")
public MatchSectionsResponse sections(
        @RequestParam(required = false) SportType sportType,
        @RequestParam(required = false) String leagueName) {
    return matchService.findMatchSections(sportType, leagueName);
}
```

Full URLs:
- `GET /api/matches/sections` — all sports, all leagues
- `GET /api/matches/sections?sportType=BASEBALL` — all baseball (MLB + KBO + etc.)
- `GET /api/matches/sections?sportType=BASEBALL&leagueName=MLB` — MLB only

---

## Frontend

### 4. MatchCard.jsx — compact prop

Add `compact` boolean prop. When truthy, append `match-card-compact` class:

```jsx
export default function MatchCard({ match, compact }) {
  const navigate = useNavigate();
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;

  return (
    <div
      className={`match-card card${compact ? ' match-card-compact' : ''}`}
      onClick={() => navigate(`/matches/${match.id}`)}
    >
      {/* all existing content unchanged */}
    </div>
  );
}
```

No other changes to content or logic. Existing `<MatchCard match={m} />` calls are unaffected.

---

### 5. MatchSections.jsx — horizontal carousel

**Props:** `sportType` (optional string), `leagueName` (optional string)

**`CarouselRow` inner component:**
- Holds a `scrollRef` (`useRef`) on the flex scroll container.
- Tracks `canScrollLeft` and `canScrollRight` booleans via a `scroll` event listener on the container (also evaluated on mount and when `matches` changes).
- Arrow click: `scrollRef.current.scrollBy({ left: ±scrollRef.current.firstChild.offsetWidth, behavior: 'smooth' })` — uses the first card's actual rendered width so it is resolution-independent.
- Left arrow disabled (and visually faded) when `canScrollLeft === false`.
- Right arrow disabled (and visually faded) when `canScrollRight === false`.
- Empty list: render a one-line `<p className="carousel-empty">경기 없음</p>` instead of the arrow+track structure.

**`MatchSections` component:**
- On mount and when `sportType` or `leagueName` changes, fetches `getMatchSections({ sportType, leagueName }, signal)` (Axios passes only defined keys, so undefined values are omitted from the query string).
- Loading: `<LoadingState />`
- Error: `<ErrorBox message="경기 현황을 불러오지 못했습니다." />`
- Success: three `<CarouselRow>` sections — 진행 중인 경기, 최근 종료 경기, 다가오는 경기.
- Cards rendered as `<MatchCard key={match.id} match={match} compact />`.

---

### 6. MatchListPage.jsx — MLB-aware leagueName

In the JSX return, replace the existing static `<MatchSections sportType={form.sportType || undefined} />` with:

```jsx
<MatchSections
  sportType={form.sportType || undefined}
  leagueName={form.sportType === 'BASEBALL' ? 'MLB' : undefined}
/>
```

No other changes to `MatchListPage`.

---

## CSS (components.css)

### New classes to append

```css
/* ===== Match Carousel ===== */
.match-section-block {
  margin-bottom: 2rem;
}

.match-section-block-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.75rem;
}

.match-carousel-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.match-carousel {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;          /* Firefox */
  flex: 1;
  min-width: 0;
}

.match-carousel::-webkit-scrollbar {
  display: none;                  /* Chrome/Safari */
}

.match-carousel-arrow {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: var(--color-text);
  transition: background 0.15s, opacity 0.15s;
}

.match-carousel-arrow:hover:not(:disabled) {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.match-carousel-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-empty {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  padding: 0.5rem 0;
}

/* ===== Compact Match Card ===== */
.match-card-compact {
  width: 220px;
  flex-shrink: 0;
  padding: 0.875rem;
}

.match-card-compact .team-name {
  max-width: 70px;
  font-size: 0.8rem;
}

.match-card-compact .score {
  font-size: 1rem;
}

.match-card-compact .match-meta {
  font-size: 0.75rem;
}
```

---

## Not Implemented (Phase 2B)

- Player statistics
- Strike zone
- Live play-by-play
- News / articles
- Pre-match AI prediction
- Automatic retry on MLB API failure
