# MLB Strike Zone Chart (존 차트) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "존 차트" tab to the MLB match detail page that plots every pitch as a coloured SVG dot on a strike zone, with pitcher/batter/inning filters, hover tooltip, and click detail panel.

**Architecture:** Self-contained `MlbStrikeZoneChart.jsx` fetches its own data (same pattern as `MlbPlayByPlay`). Backend adds two DTOs, one service method, and one endpoint. SVG rendered inline with no charting library.

**Tech Stack:** Java/Spring Boot (Lombok, Jackson), React 18, inline SVG, existing CSS variable system.

---

## File Map

| Action | File |
|--------|------|
| CREATE | `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPitchPointResponse.java` |
| CREATE | `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPitchZoneResponse.java` |
| MODIFY | `src/main/java/com/sport/web_sport/baseball/service/MlbGameDetailService.java` |
| MODIFY | `src/main/java/com/sport/web_sport/sports/controller/MatchApiController.java` |
| MODIFY | `frontend/src/api/mlbApi.js` |
| CREATE | `frontend/src/components/MlbStrikeZoneChart.jsx` |
| MODIFY | `frontend/src/styles/components.css` |
| MODIFY | `frontend/src/pages/MatchDetailPage.jsx` |

---

## Task 1: Create MlbPitchPointResponse DTO

**Files:**
- Create: `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPitchPointResponse.java`

- [ ] **Step 1: Create the file**

```java
package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlbPitchPointResponse {
    private int inning;
    private String halfInning;
    private String batterName;
    private String pitcherName;
    private String pitchType;
    private String pitchDescription;
    private String callDescription;
    private boolean isBall;
    private boolean isStrike;
    private boolean isInPlay;
    private Integer zone;
    private Double plateX;
    private Double plateZ;
    private Double strikeZoneTop;
    private Double strikeZoneBottom;
    private Double startSpeed;
    private Double endSpeed;
}
```

---

## Task 2: Create MlbPitchZoneResponse DTO

**Files:**
- Create: `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPitchZoneResponse.java`

- [ ] **Step 1: Create the file**

```java
package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MlbPitchZoneResponse {
    private Long matchId;
    private long gamePk;
    private int totalPitches;
    private List<MlbPitchPointResponse> pitches;
}
```

---

## Task 3: Add getPitchZone to MlbGameDetailService

**Files:**
- Modify: `src/main/java/com/sport/web_sport/baseball/service/MlbGameDetailService.java`

- [ ] **Step 1: Add the method at the end of the class (before the closing brace), after `getPlayByPlay`**

The method follows the same guard pattern as `getPlayByPlay`. Add it after line 252 (after the `getPlayByPlay` method closes), before the `statStr` helper and the final `}`:

```java
@Transactional(readOnly = true)
public MlbPitchZoneResponse getPitchZone(Long matchId) {
    Match match = matchRepository.findById(matchId)
            .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));

    if (match.getSportType() != SportType.BASEBALL
            || match.getExternalId() == null
            || !match.getExternalId().startsWith("MLB-")) {
        return MlbPitchZoneResponse.builder()
                .matchId(matchId)
                .gamePk(0)
                .pitches(List.of())
                .totalPitches(0)
                .build();
    }

    long gamePk = Long.parseLong(match.getExternalId().substring(4));
    JsonNode feed = mlbApiService.fetchGameFeedLive(gamePk);

    List<MlbPitchPointResponse> pitches = new ArrayList<>();
    if (feed != null) {
        JsonNode allPlays = feed.path("liveData").path("plays").path("allPlays");
        if (allPlays.isArray()) {
            for (JsonNode play : allPlays) {
                int inning = play.path("about").path("inning").asInt(0);
                String halfInning = play.path("about").path("halfInning").asText("");
                String batterName = play.path("matchup").path("batter").path("fullName").asText("");
                String pitcherName = play.path("matchup").path("pitcher").path("fullName").asText("");

                for (JsonNode event : play.path("playEvents")) {
                    if (!"pitch".equals(event.path("type").asText())) continue;

                    JsonNode pd = event.path("pitchData");
                    JsonNode coords = pd.path("coordinates");
                    JsonNode details = event.path("details");

                    if (coords.isMissingNode() || !coords.has("pX") || !coords.has("pZ")) continue;
                    JsonNode pxNode = coords.path("pX");
                    JsonNode pzNode = coords.path("pZ");
                    if (pxNode.isNull() || pzNode.isNull()) continue;

                    pitches.add(MlbPitchPointResponse.builder()
                            .inning(inning)
                            .halfInning(halfInning)
                            .batterName(batterName)
                            .pitcherName(pitcherName)
                            .pitchType(details.path("type").path("description").asText(null))
                            .pitchDescription(details.path("description").asText(null))
                            .callDescription(details.path("call").path("description").asText(null))
                            .isBall(details.path("isBall").asBoolean(false))
                            .isStrike(details.path("isStrike").asBoolean(false))
                            .isInPlay(details.path("isInPlay").asBoolean(false))
                            .zone(pd.has("zone") && !pd.path("zone").isNull() ? pd.path("zone").asInt() : null)
                            .plateX(pxNode.asDouble())
                            .plateZ(pzNode.asDouble())
                            .strikeZoneTop(pd.has("strikeZoneTop") && !pd.path("strikeZoneTop").isNull()
                                    ? pd.path("strikeZoneTop").asDouble() : null)
                            .strikeZoneBottom(pd.has("strikeZoneBottom") && !pd.path("strikeZoneBottom").isNull()
                                    ? pd.path("strikeZoneBottom").asDouble() : null)
                            .startSpeed(pd.has("startSpeed") && !pd.path("startSpeed").isNull()
                                    ? pd.path("startSpeed").asDouble() : null)
                            .endSpeed(pd.has("endSpeed") && !pd.path("endSpeed").isNull()
                                    ? pd.path("endSpeed").asDouble() : null)
                            .build());
                }
            }
        }
    }

    return MlbPitchZoneResponse.builder()
            .matchId(matchId)
            .gamePk(gamePk)
            .pitches(pitches)
            .totalPitches(pitches.size())
            .build();
}
```

No new imports needed — `MlbPitchZoneResponse`, `MlbPitchPointResponse`, `ArrayList`, `List`, `JsonNode`, `Match`, `SportType` are all already in scope via the existing imports at the top of the file.

---

## Task 4: Add endpoint to MatchApiController + compile

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/controller/MatchApiController.java`

- [ ] **Step 1: Add import for MlbPitchZoneResponse**

At the top of `MatchApiController.java`, after the existing MLB import line:
```java
import com.sport.web_sport.baseball.dto.response.MlbPitchZoneResponse;
```

- [ ] **Step 2: Add the endpoint method at the end of the class (after `mlbPlayByPlay`)**

```java
@GetMapping("/{id}/mlb-pitch-zone")
public ResponseEntity<MlbPitchZoneResponse> mlbPitchZone(@PathVariable Long id) {
    MlbPitchZoneResponse response = mlbGameDetailService.getPitchZone(id);
    return ResponseEntity.ok(response);
}
```

- [ ] **Step 3: Compile to verify backend**

Run from project root (Windows):
```
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS` with no errors. If you see `cannot find symbol` errors, check that both DTO files are saved in the correct package directory.

---

## Task 5: Add getMlbPitchZone to mlbApi.js

**Files:**
- Modify: `frontend/src/api/mlbApi.js`

- [ ] **Step 1: Append the export to the end of the file**

Current file content after change:
```js
import axiosInstance from './axiosInstance';

export const syncMlbSchedule = (startDate, endDate) =>
  axiosInstance.post('/admin/mlb/sync/schedule', { startDate, endDate });

export const getMlbGameDetail = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/mlb-detail`, { signal });

export const getMlbPlayByPlay = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/mlb-play-by-play`, { signal });

export const getMlbPitchZone = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/mlb-pitch-zone`, { signal });
```

---

## Task 6: Create MlbStrikeZoneChart.jsx

**Files:**
- Create: `frontend/src/components/MlbStrikeZoneChart.jsx`

- [ ] **Step 1: Create the full component**

```jsx
import { useState, useEffect, useRef } from 'react';
import { getMlbPitchZone } from '../api/mlbApi';

const SVG_W = 300;
const SVG_H = 350;
const PAD = 20;

function svgX(px) {
  return PAD + (px - (-2.0)) / 4.0 * (SVG_W - PAD * 2);
}

function svgY(pz) {
  return PAD + (5.0 - pz) / 4.5 * (SVG_H - PAD * 2);
}

function pitchDotClass(pitch) {
  if (pitch.isInPlay) return 'pitch-dot pitch-dot-inplay';
  if (pitch.isStrike) return 'pitch-dot pitch-dot-strike';
  return 'pitch-dot pitch-dot-ball';
}

function inningLabel(pitch) {
  return `${pitch.inning}회 ${pitch.halfInning === 'top' ? '초' : '말'}`;
}

export default function MlbStrikeZoneChart({ matchId }) {
  const [pitches, setPitches] = useState([]);
  const [filterPitcher, setFilterPitcher] = useState('전체');
  const [filterBatter, setFilterBatter] = useState('전체');
  const [filterInning, setFilterInning] = useState('전체');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [hoveredPitch, setHoveredPitch] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getMlbPitchZone(matchId, controller.signal)
      .then(res => setPitches(res.data.pitches ?? []))
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, [matchId]);

  const filteredPitches = pitches.filter(p => {
    if (filterPitcher !== '전체' && p.pitcherName !== filterPitcher) return false;
    if (filterBatter !== '전체' && p.batterName !== filterBatter) return false;
    if (filterInning !== '전체' && inningLabel(p) !== filterInning) return false;
    return true;
  });

  const avgZoneTop = filteredPitches.length
    ? filteredPitches.reduce((s, p) => s + (p.strikeZoneTop ?? 3.5), 0) / filteredPitches.length
    : 3.5;
  const avgZoneBottom = filteredPitches.length
    ? filteredPitches.reduce((s, p) => s + (p.strikeZoneBottom ?? 1.5), 0) / filteredPitches.length
    : 1.5;

  const pitchers = ['전체', ...new Set(pitches.map(p => p.pitcherName))];
  const batters = ['전체', ...new Set(pitches.map(p => p.batterName))];
  const innings = ['전체', ...new Set(pitches.map(p => inningLabel(p)))];

  const zoneLeft = svgX(-0.83);
  const zoneRight = svgX(0.83);
  const zoneTop = svgY(avgZoneTop);
  const zoneBottom = svgY(avgZoneBottom);

  function handleFilterChange(setter) {
    return e => {
      setter(e.target.value);
      setSelectedPitch(null);
    };
  }

  function handleMouseEnter(pitch, e) {
    setHoveredPitch(pitch);
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10 });
  }

  function handleClick(pitch) {
    setSelectedPitch(prev => prev === pitch ? null : pitch);
  }

  if (pitches.length === 0) {
    return (
      <div className="card strike-zone-section">
        <h3 className="detail-section-title">존 차트</h3>
        <div style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>
          투구 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="card strike-zone-section">
      <h3 className="detail-section-title">존 차트</h3>

      <div className="strike-zone-filters">
        <select value={filterPitcher} onChange={handleFilterChange(setFilterPitcher)}>
          {pitchers.map(p => (
            <option key={p} value={p}>{p === '전체' ? '투수: 전체' : p}</option>
          ))}
        </select>
        <select value={filterBatter} onChange={handleFilterChange(setFilterBatter)}>
          {batters.map(b => (
            <option key={b} value={b}>{b === '전체' ? '타자: 전체' : b}</option>
          ))}
        </select>
        <select value={filterInning} onChange={handleFilterChange(setFilterInning)}>
          {innings.map(i => (
            <option key={i} value={i}>{i === '전체' ? '이닝: 전체' : i}</option>
          ))}
        </select>
      </div>

      <div className="strike-zone-chart" ref={containerRef}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', background: '#1e293b', borderRadius: '8px' }}
        >
          {/* Centre line (home plate reference) */}
          <line
            x1={svgX(0)} y1={svgY(0.5) - 6}
            x2={svgX(0)} y2={svgY(0.5) + 6}
            stroke="#475569" strokeWidth="1"
          />

          {/* Strike zone box */}
          <rect
            x={zoneLeft}
            y={zoneTop}
            width={zoneRight - zoneLeft}
            height={zoneBottom - zoneTop}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="2"
            strokeDasharray="6 3"
          />

          {/* Pitch dots */}
          {filteredPitches.map((pitch, i) => (
            <circle
              key={i}
              cx={svgX(pitch.plateX)}
              cy={svgY(pitch.plateZ)}
              r={selectedPitch === pitch ? 7 : 5}
              className={`${pitchDotClass(pitch)}${selectedPitch === pitch ? ' pitch-dot--selected' : ''}`}
              onMouseEnter={e => handleMouseEnter(pitch, e)}
              onMouseLeave={() => setHoveredPitch(null)}
              onClick={() => handleClick(pitch)}
            />
          ))}
        </svg>

        {hoveredPitch && (
          <div
            className="pitch-tooltip"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="pitch-tooltip-type">{hoveredPitch.pitchType ?? '-'}</div>
            <div>{hoveredPitch.callDescription ?? '-'}</div>
            {hoveredPitch.startSpeed && <div>{hoveredPitch.startSpeed} mph</div>}
            <div className="pitch-tooltip-matchup">
              {hoveredPitch.batterName} vs {hoveredPitch.pitcherName}
            </div>
            <div>{inningLabel(hoveredPitch)}</div>
          </div>
        )}
      </div>

      <div className="strike-zone-legend">
        <span><span className="legend-dot legend-dot-ball" />볼</span>
        <span><span className="legend-dot legend-dot-strike" />스트라이크</span>
        <span><span className="legend-dot legend-dot-inplay" />인플레이</span>
      </div>

      {selectedPitch && (
        <div className="pitch-detail-panel">
          <button className="pitch-detail-close" onClick={() => setSelectedPitch(null)}>×</button>
          <div className="pitch-detail-grid">
            <div><span className="pitch-detail-label">구종</span>{selectedPitch.pitchType ?? '-'}</div>
            <div><span className="pitch-detail-label">판정</span>{selectedPitch.callDescription ?? '-'}</div>
            <div><span className="pitch-detail-label">구속</span>{selectedPitch.startSpeed ? `${selectedPitch.startSpeed} mph` : '-'}</div>
            <div><span className="pitch-detail-label">종속</span>{selectedPitch.endSpeed ? `${selectedPitch.endSpeed} mph` : '-'}</div>
            <div><span className="pitch-detail-label">타자</span>{selectedPitch.batterName}</div>
            <div><span className="pitch-detail-label">투수</span>{selectedPitch.pitcherName}</div>
            <div><span className="pitch-detail-label">이닝</span>{inningLabel(selectedPitch)}</div>
            <div><span className="pitch-detail-label">존</span>{selectedPitch.zone ?? '-'}</div>
            <div>
              <span className="pitch-detail-label">결과</span>
              {selectedPitch.isInPlay ? '인플레이' : selectedPitch.isStrike ? '스트라이크' : '볼'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Task 7: Add CSS to components.css

**Files:**
- Modify: `frontend/src/styles/components.css`

- [ ] **Step 1: Append the following block at the very end of `components.css` (after the last existing rule on line 2472)**

```css
/* MLB Strike Zone Chart (존 차트) */
.strike-zone-section { padding: 1.25rem; }

.strike-zone-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.strike-zone-filters select {
  font-size: 0.85rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
}

.strike-zone-chart {
  position: relative;
  max-width: 400px;
  margin: 0 auto 1rem;
}

.pitch-dot {
  cursor: pointer;
  opacity: 0.85;
}
.pitch-dot:hover { opacity: 1; }

.pitch-dot-ball   { fill: rgba(59, 130, 246, 0.75); }
.pitch-dot-strike { fill: rgba(239, 68, 68, 0.75); }
.pitch-dot-inplay { fill: rgba(34, 197, 94, 0.75); }

.pitch-dot--selected {
  stroke: #ffffff;
  stroke-width: 2;
  opacity: 1;
}

.strike-zone-legend {
  display: flex;
  gap: 1.2rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.25rem;
  vertical-align: middle;
}

.legend-dot-ball   { background: rgba(59, 130, 246, 0.75); }
.legend-dot-strike { background: rgba(239, 68, 68, 0.75); }
.legend-dot-inplay { background: rgba(34, 197, 94, 0.75); }

.pitch-tooltip {
  position: absolute;
  z-index: 10;
  background: rgba(15, 23, 42, 0.95);
  color: #f1f5f9;
  border-radius: var(--radius);
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  pointer-events: none;
  white-space: normal;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  max-width: 210px;
  line-height: 1.5;
}

.pitch-tooltip-type {
  font-weight: 700;
  font-size: 0.82rem;
  margin-bottom: 0.15rem;
  color: #93c5fd;
}

.pitch-tooltip-matchup {
  color: #94a3b8;
  margin-top: 0.15rem;
  font-size: 0.75rem;
}

.pitch-detail-panel {
  position: relative;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1rem 1rem 0.75rem;
  margin-top: 0.75rem;
}

.pitch-detail-close {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.1rem;
  color: var(--color-text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0;
}
.pitch-detail-close:hover { color: var(--color-text); }

.pitch-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.4rem 1rem;
  font-size: 0.83rem;
}

.pitch-detail-label {
  font-weight: 600;
  color: var(--color-text-muted);
  margin-right: 0.3rem;
}
```

---

## Task 8: Wire 존 차트 tab into MatchDetailPage

**Files:**
- Modify: `frontend/src/pages/MatchDetailPage.jsx`

- [ ] **Step 1: Add import for MlbStrikeZoneChart**

After the existing `import MlbPlayByPlay` line (line 19), add:
```js
import MlbStrikeZoneChart from '../components/MlbStrikeZoneChart';
```

- [ ] **Step 2: Update MLB_TABS constant (line 25)**

Change:
```js
const MLB_TABS = ['경기정보', '라인업', '기록', '중계', '채팅'];
```
To:
```js
const MLB_TABS = ['경기정보', '라인업', '기록', '중계', '존 차트', '채팅'];
```

- [ ] **Step 3: Add 존 차트 tab panel**

After the `{activeTab === '중계' && ...}` block (after line 329), add:
```jsx
{activeTab === '존 차트' && (
  <MlbStrikeZoneChart matchId={matchId} />
)}
```

---

## Task 9: Build verification

- [ ] **Step 1: Build the frontend**

```
cd frontend
npm run build
```

Expected: `✓ built in Xs` with no errors. Warnings about unused variables are acceptable. Errors are not.

- [ ] **Step 2: Compile the backend**

```
cd ..
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

- [ ] **Step 3: Manual test checklist**

Start the app and navigate to an MLB match detail page:
1. Click the "존 차트" tab — chart loads with pitch dots visible
2. Hover over a dot — tooltip appears with pitch type, call, speed, batter/pitcher, inning
3. Click a dot — detail panel appears below chart; click same dot again → panel closes
4. Change pitcher filter — chart re-renders with only that pitcher's pitches; detail panel resets
5. Change batter filter, inning filter — same behaviour
6. Return to "전체" filters — all pitches shown
7. Verify legend shows 볼 / 스트라이크 / 인플레이 dots
8. Verify strike zone box is visible as dashed white rect
