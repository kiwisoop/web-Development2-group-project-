---
title: MLB Strike Zone Chart — Phase 3D
date: 2026-05-20
branch: BASEBALL
---

# MLB Strike Zone Chart (존 차트)

## Overview

Add a new "존 차트" tab to the MLB match detail page that visualises every pitch location for a game as coloured dots on an SVG strike zone chart. Users can filter by pitcher, batter, or inning, hover to see a pitch tooltip, and click a dot to open a detail panel.

Pitch coordinate data is already confirmed present: 271/271 pitches have `plateX` (coordinates.pX) and `plateZ` (coordinates.pZ) in the MLB feed/live API.

---

## Backend

### DTOs — `baseball/dto/response/`

**`MlbPitchPointResponse`**
| Field | Type | Source |
|---|---|---|
| inning | int | about.inning |
| halfInning | String | about.halfInning |
| batterName | String | matchup.batter.fullName |
| pitcherName | String | matchup.pitcher.fullName |
| pitchType | String | details.type.description |
| pitchDescription | String | details.description |
| callDescription | String | details.call.description |
| isBall | boolean | details.isBall |
| isStrike | boolean | details.isStrike |
| isInPlay | boolean | details.isInPlay |
| zone | Integer | pitchData.zone (nullable) |
| plateX | Double | pitchData.coordinates.pX |
| plateZ | Double | pitchData.coordinates.pZ |
| strikeZoneTop | Double | pitchData.strikeZoneTop |
| strikeZoneBottom | Double | pitchData.strikeZoneBottom |
| startSpeed | Double | pitchData.startSpeed |
| endSpeed | Double | pitchData.endSpeed |

**`MlbPitchZoneResponse`**
| Field | Type |
|---|---|
| matchId | Long |
| gamePk | long |
| totalPitches | int |
| pitches | List\<MlbPitchPointResponse\> |

### Service — `MlbGameDetailService.getPitchZone(Long matchId)`

- Load Match by matchId; throw if not found
- If sportType != BASEBALL or externalId doesn't start with `MLB-`, return response with empty pitch list (not null)
- Extract gamePk, call `mlbApiService.fetchGameFeedLive(gamePk)`
- If feed is null, return empty pitch list
- Iterate `liveData.plays.allPlays[].playEvents[]`
- Include only events where `type == "pitch"` and `pitchData.coordinates.pX` and `pZ` are present (not missing/null)
- Map each to `MlbPitchPointResponse`
- Return `MlbPitchZoneResponse` with `totalPitches = pitches.size()`

### Endpoint — `MatchApiController`

```
GET /api/matches/{id}/mlb-pitch-zone
```
- Public (no session/auth check)
- Returns `ResponseEntity<MlbPitchZoneResponse>`
- Always returns 200; empty pitch list if not MLB or no data

---

## Frontend

### API — `mlbApi.js`

```js
export const getMlbPitchZone = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/mlb-pitch-zone`, { signal });
```

### Component — `MlbStrikeZoneChart.jsx`

Self-contained component. Receives `matchId` as prop.

**State**
- `pitches` — full pitch list from API
- `filterPitcher` — default `'전체'`
- `filterBatter` — default `'전체'`
- `filterInning` — default `'전체'`
- `selectedPitch` — clicked pitch object or `null`
- `hoveredPitch` — moused-over pitch object or `null`
- `tooltipPos` — `{ x, y }` for tooltip placement

**Derived values (computed inline)**
- `filteredPitches` — pitches matching all three active filters
- `avgZoneTop` — mean of `strikeZoneTop` across filteredPitches; fallback `3.5`
- `avgZoneBottom` — mean of `strikeZoneBottom` across filteredPitches; fallback `1.5`
- Filter option lists — unique values from full `pitches` (not filtered, so options don't collapse)

**SVG coordinate system**

ViewBox: `0 0 300 350`

| Axis | Domain | SVG range |
|---|---|---|
| X (plateX) | −2.0 → +2.0 | 20 → 280 |
| Y (plateZ) | 5.0 → 0.5 (inverted) | 20 → 330 |

Mapping functions:
```
svgX(px) = 20 + (px - (-2.0)) / 4.0 * 260
svgY(pz) = 20 + (5.0 - pz) / 4.5 * 310
```

Strike zone box (SVG `<rect>`):
- left/right: svgX(−0.83) to svgX(0.83)
- top/bottom: svgY(avgZoneTop) to svgY(avgZoneBottom)

Each pitch → SVG `<circle>` with:
- `cx={svgX(pitch.plateX)}`, `cy={svgY(pitch.plateZ)}`
- `r={5}` (selected: `r={7}`)
- className: `pitch-dot pitch-dot-ball | pitch-dot-strike | pitch-dot-inplay`
- `pitch-dot--selected` modifier when `selectedPitch === pitch`

**Interactions**

*Hover tooltip*: `onMouseEnter` sets `hoveredPitch` + `tooltipPos`; `tooltipPos` is derived from the mouse event using `event.clientX/Y - containerRef.current.getBoundingClientRect().left/top` so it tracks correctly regardless of SVG scale. Rendered as absolutely-positioned `<div className="pitch-tooltip">` overlaid on the SVG container (container is `position: relative`). Shows: pitchType, callDescription, startSpeed, batterName, pitcherName, inning/halfInning. `onMouseLeave` clears.

*Click detail panel*: `onClick` sets `selectedPitch` (clicking same dot clears it). Rendered as `<div className="pitch-detail-panel">` below the SVG. Shows all fields. Includes a close button (×).

*Filter change*: resets `selectedPitch` to null.

**Legend**: row of three coloured dots below chart — 볼 / 스트라이크 / 인플레이.

### Tab integration — `MatchDetailPage.jsx`

```js
const MLB_TABS = ['경기정보', '라인업', '기록', '중계', '존 차트', '채팅'];
```

New tab panel:
```jsx
{activeTab === '존 차트' && (
  <MlbStrikeZoneChart matchId={matchId} />
)}
```

---

## Styling — `components.css`

New classes (bright card-style, matching existing MLB components):

| Class | Purpose |
|---|---|
| `.strike-zone-section` | Card wrapper with padding |
| `.strike-zone-filters` | Flex row of dropdowns, wraps on small screens |
| `.strike-zone-filters select` | Styled selects matching existing form elements |
| `.strike-zone-chart` | `position: relative` container holding SVG + tooltip overlay |
| `.strike-zone-box` | SVG rect — dashed border, transparent fill |
| `.pitch-dot` | SVG circle base — `cursor: pointer` |
| `.pitch-dot-ball` | Blue-accent fill |
| `.pitch-dot-strike` | Red/orange-accent fill |
| `.pitch-dot-inplay` | Green-accent fill |
| `.pitch-dot--selected` | Larger radius + white outline ring |
| `.strike-zone-legend` | Flex row of dot + label pairs |
| `.pitch-detail-panel` | Card below chart for selected pitch details |
| `.pitch-tooltip` | Absolutely-positioned hover tooltip |

SVG background: `var(--color-bg-card)` or dark variant to make dots visible.

---

## What is NOT implemented

- Hot/cold zone heatmap (Phase 3D scope excludes this)
- News/articles
- Git commit (user reviews before committing)

---

## Verification

```bash
cd frontend && npm run build
cd .. && ./mvnw.cmd compile
```

Then open the MLB match detail page and click the 존 차트 tab.
