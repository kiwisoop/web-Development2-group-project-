# MLB Play-by-Play (문자중계) — Design Spec

**Date:** 2026-05-20  
**Branch:** BASEBALL  
**Phase:** 3B

---

## Goal

MLB 경기 상세 페이지에 이닝별 문자중계(play-by-play) 섹션을 추가한다.  
데이터 소스: `https://statsapi.mlb.com/api/v1.1/game/{gamePk}/feed/live` → `liveData.plays.allPlays`

---

## Scope

**포함:**
- 백엔드 DTO 2개, 서비스 메서드 1개, 엔드포인트 1개
- 프론트엔드 API 함수 1개, 컴포넌트 1개, CSS 스타일
- 라이브 경기 30초 자동 갱신

**제외 (이번 Phase):**
- Hot/Cold Zone
- 뉴스/기사
- AI 예측
- git commit

---

## Architecture

### 접근 방식: 독립 엔드포인트 (Approach A)

기존 MLB detail과 분리된 별도 엔드포인트.  
play-by-play만 독립적으로 폴링 가능하며 기존 코드 변경 최소화.

---

## Backend

### DTOs

**`MlbPlayEventResponse`** (`baseball/dto/response/`)

| 필드 | 타입 | 설명 |
|------|------|------|
| inning | int | 이닝 번호 |
| halfInning | String | "top" / "bottom" |
| batterName | String | 타자 전체 이름 |
| pitcherName | String | 투수 전체 이름 |
| event | String | 결과 이벤트명 (e.g. "Home Run") |
| description | String | 플레이 설명 문장 |
| rbi | int | 타점 (없으면 0) |
| awayScore | int | 원정 팀 스코어 |
| homeScore | int | 홈 팀 스코어 |
| balls | int | 볼 카운트 |
| strikes | int | 스트라이크 카운트 |
| outs | int | 아웃 카운트 |

**`MlbPlayByPlayResponse`** (`baseball/dto/response/`)

| 필드 | 타입 | 설명 |
|------|------|------|
| matchId | Long | 내부 경기 ID |
| gamePk | long | MLB gamePk |
| plays | List\<MlbPlayEventResponse\> | 전체 플레이 목록 (시간순) |

### Service

`MlbGameDetailService.getPlayByPlay(Long matchId)`:
1. matchId로 Match 조회
2. `sportType != BASEBALL` 또는 `externalId`가 `MLB-`로 시작하지 않으면 빈 리스트 반환
3. gamePk 추출 → `mlbApiService.fetchGameFeedLive(gamePk)`
4. `liveData.plays.allPlays` 파싱 → `MlbPlayEventResponse` 리스트 생성
5. `MlbPlayByPlayResponse` 반환

파싱 필드:
- `about.inning`, `about.halfInning`
- `matchup.batter.fullName`, `matchup.pitcher.fullName`
- `result.event`, `result.description`, `result.rbi`
- `result.awayScore`, `result.homeScore`
- `count.balls`, `count.strikes`, `count.outs`

### Endpoint

```
GET /api/matches/{id}/mlb-play-by-play
```
- 컨트롤러: `MatchApiController` (기존 파일에 추가)
- 인증: 불필요 (공개 읽기)
- 응답: `ResponseEntity<MlbPlayByPlayResponse>`
- MLB 아닌 경기 또는 플레이 없음: 빈 plays 리스트 반환 (에러 없음)

---

## Frontend

### `mlbApi.js` 추가

```js
export const getMlbPlayByPlay = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/mlb-play-by-play`, { signal });
```

### `MlbPlayByPlay.jsx`

**Props:** `matchId` (String), `isLive` (Boolean)

**동작:**
- 마운트 시 play-by-play fetch
- `isLive === true`이면 30초마다 재fetch (`setInterval` + cleanup)
- `plays`가 비어 있으면 컴포넌트 전체를 렌더링하지 않음

**표시 구조:**
```
[문자중계 섹션 헤더]
  [1회 초] ─────────────────
    [플레이 카드]
      타자 vs 투수
      이벤트 (e.g. "홈런")
      설명 문장
      스코어 뱃지 (원정 3 - 홈 1)
      볼카운트 (B2 S1 O2)
  [1회 말] ─────────────────
    ...
```

**이닝 헤더 표기:**
- `halfInning === "top"` → `{inning}회 초`
- `halfInning === "bottom"` → `{inning}회 말`

### `MatchDetailPage.jsx` 렌더 순서 (MLB 경기)

1. Scoreboard
2. MLB detail section (기존, 변경 없음)
3. **MlbPlayByPlay** ← 신규
4. MatchActionPanel
5. AiAnalysisPreview
6. PredictionPreview
7. 통계 / 타임라인
8. ChatBox

추가 state:
- 없음 — `MlbPlayByPlay`가 자체적으로 fetch 및 polling 관리

### `components.css` 추가 클래스

| 클래스 | 용도 |
|--------|------|
| `.mlb-pbp-section` | 전체 섹션 카드 래퍼 |
| `.mlb-pbp-inning-header` | 이닝 구분 헤더 |
| `.mlb-pbp-play-card` | 플레이 1건 카드 |
| `.mlb-pbp-score-badge` | 스코어 표시 뱃지 |
| `.mlb-pbp-count` | 볼카운트 표시 |

---

## Data Flow

```
MatchDetailPage
  └── MlbPlayByPlay (matchId, isLive)
        ├── mount: getMlbPlayByPlay(matchId)
        ├── isLive: setInterval(30s) → getMlbPlayByPlay(matchId)
        └── render: plays → group by inning+halfInning → cards
```

---

## Error Handling

- fetch 실패 시 기존 plays 유지 (silent fail), 콘솔 에러
- `plays === []`이면 섹션 자체 미렌더링
- AbortController로 언마운트 시 요청 취소

---

## Verification

```bash
cd frontend && npm run build
cd .. && .\mvnw.cmd compile
```
