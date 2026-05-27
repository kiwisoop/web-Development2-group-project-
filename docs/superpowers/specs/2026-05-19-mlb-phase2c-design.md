# MLB Phase 2C — Team Logos and Abbreviations in Compact Cards

**Date:** 2026-05-19
**Branch:** BASEBALL
**Depends on:** MLB Phase 2B (compact MatchCard, carousel MatchSections)
**Status:** Approved

---

## Goal

Show MLB team abbreviations and logos in the horizontal carousel compact cards instead of truncated full team names. Backend generates a logo URL during sync from the MLB team ID. Frontend renders logo + abbreviation + score in a stacked two-row layout inside compact cards only.

## Out of Scope

- Player statistics
- Strike zone
- News / articles
- Live play-by-play
- Pre-match AI prediction
- Downloading or storing image binaries
- Changes to the full (non-compact) MatchCard layout
- Git commit (user reviews first)

---

## Architecture

Two independent changes:

1. **Backend** — `MlbSyncService.getOrCreateTeam` gains a `teamId` param and sets `logoUrl` on creation. Existing teams with `null` logoUrl are backfilled on the next sync. No entity, DTO, or controller changes needed — `Team.logoUrl`, `TeamResponse.logoUrl`, and the nested `MatchResponse.homeTeam`/`awayTeam` are already wired up end-to-end.

2. **Frontend** — `MatchCard` compact mode replaces the existing `.match-teams` block with a new `.compact-teams` stacked layout. New CSS classes added to `components.css`. Full-card layout is completely unchanged.

---

## Backend

### `MlbSyncService` changes

**New private helper:**

```java
private String buildMlbTeamLogoUrl(long teamId) {
    return "https://midfield.mlbstatic.com/v1/team/" + teamId + "/spots/96";
}
```

**Thread `teamId` through the sync loop:**

In the `sync(String startDate, String endDate)` method, read `teamId` from each team node before calling `getOrCreateTeam`:

```java
long homeTeamId = homeNode.path("team").path("id").asLong();
long awayTeamId = awayNode.path("team").path("id").asLong();

Team homeTeam = getOrCreateTeam(
        homeNode.path("team").path("name").asText(),
        homeNode.path("team").path("abbreviation").asText(),
        homeTeamId,
        mlbLeague, createdTeams
);
Team awayTeam = getOrCreateTeam(
        awayNode.path("team").path("name").asText(),
        awayNode.path("team").path("abbreviation").asText(),
        awayTeamId,
        mlbLeague, createdTeams
);
```

**Updated `getOrCreateTeam` signature and body:**

```java
private Team getOrCreateTeam(String teamName, String abbreviation,
                              long teamId, League league, int[] newCount) {
    Optional<Team> existing = teamRepository.findBySportTypeAndTeamName(SportType.BASEBALL, teamName);
    if (existing.isPresent()) {
        Team t = existing.get();
        if (t.getLogoUrl() == null) {
            t.setLogoUrl(buildMlbTeamLogoUrl(teamId));
            teamRepository.save(t);
        }
        return t;
    }
    newCount[0]++;
    return teamRepository.save(Team.builder()
            .sportType(SportType.BASEBALL)
            .league(league)
            .teamName(teamName)
            .shortName(abbreviation)
            .logoUrl(buildMlbTeamLogoUrl(teamId))
            .build());
}
```

**Behavior:**
- New team: `logoUrl` set from teamId.
- Existing team with `logoUrl == null`: backfilled and saved.
- Existing team with `logoUrl` already set: no change.

No import changes needed. `Team.logoUrl` field already exists (nullable `String`).

---

## Frontend

### `MatchCard.jsx` — compact stacked layout

When `compact` is true, replace the existing `.match-teams` / `.match-vs` block with:

```jsx
<div className="compact-teams">
  <CompactTeamRow team={match.homeTeam} score={hasScore ? match.homeScore : null} />
  <CompactTeamRow team={match.awayTeam} score={hasScore ? match.awayScore : null} />
</div>
```

`CompactTeamRow` is a small inner function component (defined at the top of `MatchCard.jsx`):

```jsx
function CompactTeamRow({ team, score }) {
  const abbr = (team?.shortName || team?.teamName || '?').slice(0, 3);
  return (
    <div className="compact-team-row">
      {team?.logoUrl ? (
        <img
          className="team-logo-compact"
          src={team.logoUrl}
          alt={abbr}
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <span
        className="team-logo-fallback"
        style={team?.logoUrl ? { display: 'none' } : {}}
      >
        {abbr}
      </span>
      <span className="compact-team-name">
        {team?.shortName || team?.teamName || '?'}
      </span>
      {score !== null && <span className="compact-score">{score}</span>}
    </div>
  );
}
```

**Fallback logic:**
- If `team.logoUrl` exists: renders `<img>`. On load error, hides `<img>` and reveals the `<span className="team-logo-fallback">` sibling.
- If `team.logoUrl` is null/undefined: renders only the fallback circle (no `<img>`).

The full-card `.match-teams` / `.match-vs` / `.team` / `.score` block is rendered when `compact` is falsy — unchanged.

---

### CSS additions (`components.css`)

Append to the end of `frontend/src/styles/components.css`:

```css
/* ===== Compact Team Rows ===== */
.compact-teams {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.compact-team-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-logo-compact {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.team-logo-fallback {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  font-size: 0.55rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-transform: uppercase;
}

.compact-team-name {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-score {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-primary);
  flex-shrink: 0;
}
```

---

## Not Implemented (Phase 2C)

- Player statistics
- Strike zone
- Live play-by-play
- News / articles
- Pre-match AI prediction
- Image caching or proxy
