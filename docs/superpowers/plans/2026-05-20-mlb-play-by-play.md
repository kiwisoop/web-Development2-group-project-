# MLB Play-by-Play (문자중계) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MLB 경기 상세 페이지에 이닝별 문자중계 섹션을 추가한다 — 별도 엔드포인트로 play-by-play 데이터를 제공하고, 라이브 경기 시 30초 자동 갱신한다.

**Architecture:** `feed/live` allPlays를 파싱하는 서비스 메서드를 `MlbGameDetailService`에 추가하고, `MatchApiController`에 공개 GET 엔드포인트를 추가한다. 프론트엔드는 `MlbPlayByPlay.jsx` 컴포넌트가 자체적으로 fetch·polling을 관리하며 `MatchDetailPage`에서 MLB detail section 바로 아래에 렌더링된다.

**Tech Stack:** Spring Boot 3.5 / Lombok / Jackson JsonNode / React 18 / Axios / CSS custom properties

> ⚠️ git commit 금지 (스펙 요구사항)

---

## File Map

| 작업 | 경로 |
|------|------|
| Create | `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPlayEventResponse.java` |
| Create | `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPlayByPlayResponse.java` |
| Modify | `src/main/java/com/sport/web_sport/baseball/service/MlbGameDetailService.java` |
| Modify | `src/main/java/com/sport/web_sport/sports/controller/MatchApiController.java` |
| Modify | `frontend/src/api/mlbApi.js` |
| Create | `frontend/src/components/MlbPlayByPlay.jsx` |
| Modify | `frontend/src/pages/MatchDetailPage.jsx` |
| Modify | `frontend/src/styles/components.css` |

---

## Task 1: DTO — MlbPlayEventResponse + MlbPlayByPlayResponse

**Files:**
- Create: `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPlayEventResponse.java`
- Create: `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPlayByPlayResponse.java`

- [ ] **Step 1: MlbPlayEventResponse 생성**

파일: `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPlayEventResponse.java`

```java
package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlbPlayEventResponse {
    private int inning;
    private String halfInning;
    private String batterName;
    private String pitcherName;
    private String event;
    private String description;
    private int rbi;
    private int awayScore;
    private int homeScore;
    private int balls;
    private int strikes;
    private int outs;
}
```

- [ ] **Step 2: MlbPlayByPlayResponse 생성**

파일: `src/main/java/com/sport/web_sport/baseball/dto/response/MlbPlayByPlayResponse.java`

```java
package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MlbPlayByPlayResponse {
    private Long matchId;
    private long gamePk;
    private List<MlbPlayEventResponse> plays;
}
```

---

## Task 2: Service — getPlayByPlay

**Files:**
- Modify: `src/main/java/com/sport/web_sport/baseball/service/MlbGameDetailService.java`

- [ ] **Step 1: getPlayByPlay 메서드 추가**

`MlbGameDetailService` 클래스 맨 아래 `statStr` 메서드 바로 위에 삽입:

```java
@Transactional(readOnly = true)
public MlbPlayByPlayResponse getPlayByPlay(Long matchId) {
    Match match = matchRepository.findById(matchId)
            .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));

    if (match.getSportType() != SportType.BASEBALL
            || match.getExternalId() == null
            || !match.getExternalId().startsWith("MLB-")) {
        return MlbPlayByPlayResponse.builder()
                .matchId(matchId)
                .gamePk(0)
                .plays(List.of())
                .build();
    }

    long gamePk = Long.parseLong(match.getExternalId().substring(4));
    JsonNode feed = mlbApiService.fetchGameFeedLive(gamePk);

    List<MlbPlayEventResponse> plays = new ArrayList<>();
    if (feed != null) {
        JsonNode allPlays = feed.path("liveData").path("plays").path("allPlays");
        if (allPlays.isArray()) {
            for (JsonNode play : allPlays) {
                JsonNode about   = play.path("about");
                JsonNode matchup = play.path("matchup");
                JsonNode result  = play.path("result");
                JsonNode count   = play.path("count");
                plays.add(MlbPlayEventResponse.builder()
                        .inning(about.path("inning").asInt(0))
                        .halfInning(about.path("halfInning").asText(""))
                        .batterName(matchup.path("batter").path("fullName").asText(""))
                        .pitcherName(matchup.path("pitcher").path("fullName").asText(""))
                        .event(result.path("event").asText(""))
                        .description(result.path("description").asText(""))
                        .rbi(result.path("rbi").asInt(0))
                        .awayScore(result.path("awayScore").asInt(0))
                        .homeScore(result.path("homeScore").asInt(0))
                        .balls(count.path("balls").asInt(0))
                        .strikes(count.path("strikes").asInt(0))
                        .outs(count.path("outs").asInt(0))
                        .build());
            }
        }
    }

    return MlbPlayByPlayResponse.builder()
            .matchId(matchId)
            .gamePk(gamePk)
            .plays(plays)
            .build();
}
```

파일 상단 import 목록에 `MlbPlayByPlayResponse`와 `MlbPlayEventResponse`가 이미 같은 패키지의 wildcard import `com.sport.web_sport.baseball.dto.response.*`로 커버되므로 추가 import 불필요.

---

## Task 3: Controller — 엔드포인트 추가 + 백엔드 컴파일

**Files:**
- Modify: `src/main/java/com/sport/web_sport/sports/controller/MatchApiController.java`

- [ ] **Step 1: import 추가**

`MatchApiController.java` 상단 import 목록에 추가 (다른 import 바로 아래):

```java
import com.sport.web_sport.baseball.dto.response.MlbPlayByPlayResponse;
```

- [ ] **Step 2: 엔드포인트 메서드 추가**

`mlbDetail` 메서드 바로 아래에 삽입:

```java
@GetMapping("/{id}/mlb-play-by-play")
public ResponseEntity<MlbPlayByPlayResponse> mlbPlayByPlay(@PathVariable Long id) {
    MlbPlayByPlayResponse response = mlbGameDetailService.getPlayByPlay(id);
    return ResponseEntity.ok(response);
}
```

- [ ] **Step 3: 백엔드 컴파일 확인**

프로젝트 루트(`E:\web3\web-sport-react-rebuild`)에서 실행:

```powershell
.\mvnw.cmd compile
```

예상 출력 (마지막 줄들):
```
[INFO] BUILD SUCCESS
[INFO] Total time: ...
```

`BUILD FAILURE`가 나오면 에러 메시지를 확인하고 수정 후 재시도.

---

## Task 4: Frontend API 함수

**Files:**
- Modify: `frontend/src/api/mlbApi.js`

- [ ] **Step 1: getMlbPlayByPlay 추가**

`frontend/src/api/mlbApi.js` 파일 끝에 추가:

```js
export const getMlbPlayByPlay = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/mlb-play-by-play`, { signal });
```

---

## Task 5: MlbPlayByPlay 컴포넌트

**Files:**
- Create: `frontend/src/components/MlbPlayByPlay.jsx`

- [ ] **Step 1: 컴포넌트 생성**

파일: `frontend/src/components/MlbPlayByPlay.jsx`

```jsx
import { useState, useEffect, useRef } from 'react';
import { getMlbPlayByPlay } from '../api/mlbApi';

export default function MlbPlayByPlay({ matchId, isLive }) {
  const [plays, setPlays] = useState([]);
  const controllerRef = useRef(null);

  const fetchPlays = () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    getMlbPlayByPlay(matchId, controllerRef.current.signal)
      .then(res => setPlays(res.data.plays ?? []))
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        console.error('문자중계 로드 실패', err);
      });
  };

  useEffect(() => {
    fetchPlays();
    const timer = isLive ? setInterval(fetchPlays, 30000) : null;
    return () => {
      clearInterval(timer);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [matchId, isLive]);

  if (!plays || plays.length === 0) return null;

  const groups = [];
  let currentKey = null;
  for (const play of plays) {
    const key = `${play.inning}-${play.halfInning}`;
    if (key !== currentKey) {
      groups.push({ inning: play.inning, halfInning: play.halfInning, plays: [] });
      currentKey = key;
    }
    groups[groups.length - 1].plays.push(play);
  }

  return (
    <div className="card mlb-pbp-section">
      <h3 className="detail-section-title">문자중계</h3>
      {groups.map(group => (
        <div key={`${group.inning}-${group.halfInning}`}>
          <div className="mlb-pbp-inning-header">
            {group.inning}회 {group.halfInning === 'top' ? '초' : '말'}
          </div>
          {group.plays.map((play, i) => (
            <div key={i} className="mlb-pbp-play-card">
              <div className="mlb-pbp-matchup">
                <span className="mlb-pbp-batter">{play.batterName}</span>
                <span className="mlb-pbp-vs"> vs </span>
                <span className="mlb-pbp-pitcher">{play.pitcherName}</span>
              </div>
              {play.event && (
                <div className="mlb-pbp-event">{play.event}</div>
              )}
              {play.description && (
                <div className="mlb-pbp-description">{play.description}</div>
              )}
              <div className="mlb-pbp-footer">
                <span className="mlb-pbp-score-badge">
                  원정 {play.awayScore} - 홈 {play.homeScore}
                </span>
                <span className="mlb-pbp-count">
                  B{play.balls} S{play.strikes} O{play.outs}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

## Task 6: MatchDetailPage 통합

**Files:**
- Modify: `frontend/src/pages/MatchDetailPage.jsx`

- [ ] **Step 1: import 추가**

`MatchDetailPage.jsx` 상단 import 목록 (`MlbDetailSection` import 바로 아래)에 추가:

```js
import MlbPlayByPlay from '../components/MlbPlayByPlay';
```

- [ ] **Step 2: JSX 렌더 블록 추가**

MLB detail section 블록 (약 194~200번 줄, `</div>` 닫는 태그) 바로 다음에 삽입:

현재 코드:
```jsx
      {data.match.sportType === 'BASEBALL' && data.match.league?.leagueName === 'MLB' && (
        <div className="detail-section">
          {mlbDetailLoading && <div className="card" style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>MLB 데이터 불러오는 중...</div>}
          {mlbDetailError && <div className="card" style={{ padding: '1rem', color: 'var(--color-error)' }}>{mlbDetailError}</div>}
          {!mlbDetailLoading && !mlbDetailError && <MlbDetailSection detail={mlbDetail} />}
        </div>
      )}
```

이 블록 바로 다음에 추가:
```jsx
      {data.match.sportType === 'BASEBALL' && data.match.league?.leagueName === 'MLB' && (
        <MlbPlayByPlay
          matchId={matchId}
          isLive={match.status === 'LIVE'}
        />
      )}
```

---

## Task 7: CSS 스타일 + 프론트엔드 빌드

**Files:**
- Modify: `frontend/src/styles/components.css`

- [ ] **Step 1: play-by-play 스타일 추가**

`frontend/src/styles/components.css` 파일 맨 끝에 추가:

```css
/* MLB Play-by-Play (문자중계) */
.mlb-pbp-section { padding: 1.25rem; }

.mlb-pbp-inning-header {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  padding: 0.5rem 0 0.25rem;
  margin-top: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.mlb-pbp-play-card {
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--color-border);
}
.mlb-pbp-play-card:last-child { border-bottom: none; }

.mlb-pbp-matchup { font-size: 0.85rem; margin-bottom: 0.2rem; }
.mlb-pbp-batter  { font-weight: 700; color: var(--color-primary); }
.mlb-pbp-vs      { color: var(--color-text-muted); margin: 0 0.2rem; }
.mlb-pbp-pitcher { font-weight: 600; color: var(--color-text); }

.mlb-pbp-event {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: 0.15rem;
}

.mlb-pbp-description {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin-bottom: 0.35rem;
}

.mlb-pbp-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.3rem;
}

.mlb-pbp-score-badge {
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 0.1rem 0.45rem;
  color: var(--color-text);
}

.mlb-pbp-count {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-family: monospace;
}
```

- [ ] **Step 2: 프론트엔드 빌드 확인**

```powershell
cd E:\web3\web-sport-react-rebuild\frontend
npm run build
```

예상 출력 (마지막 줄들):
```
✓ built in ...s
```

에러가 나오면 메시지를 확인하고 수정 후 재시도.

- [ ] **Step 3: 백엔드 최종 컴파일 확인**

```powershell
cd E:\web3\web-sport-react-rebuild
.\mvnw.cmd compile
```

예상 출력:
```
[INFO] BUILD SUCCESS
```

---

## 완료 후 수동 테스트 방법

1. `.\mvnw.cmd spring-boot:run` 으로 서버 시작
2. 브라우저에서 MLB 경기 상세 페이지 접속
3. MLB detail section 아래에 **문자중계** 섹션 확인
4. plays가 없는 경기(SCHEDULED)에서는 섹션이 렌더링되지 않아야 함
5. API 직접 확인: `GET http://localhost:8080/api/matches/{matchId}/mlb-play-by-play`

---

## 의도적으로 구현하지 않은 것

- Hot/Cold Zone
- 뉴스/기사
- AI 예측
- git commit
