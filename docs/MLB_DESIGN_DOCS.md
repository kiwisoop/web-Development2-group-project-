# MLB 기능 설계 문서

> `docs/superpowers/specs/` 의 9개 스펙 파일을 하나로 통합한 설계 문서입니다.  
> 보고서 **4장(시스템 설계 및 아키텍처)** 작성 시 참고용으로 활용하세요.

---

## Phase 1 — MLB 일정·결과 동기화 (2026-05-19)

### 목표
관리자가 날짜 범위를 지정하면 MLB Stats API에서 경기 일정·결과를 가져와 기존 `League`, `Team`, `Match` 엔티티에 저장한다.

### 아키텍처 결정
- 기존 `sports`, `admin`, `user` 패키지와 분리된 독립 `baseball` 패키지 생성
- Spring Security 추가 없이 기존 `authService.requireAdmin(session)` 패턴 재사용
- `Match.externalId = "MLB-{gamePk}"` nullable 컬럼 추가 → 기존 샘플 데이터 영향 없음
- `findByExternalId`로 중복 저장 방지 (있으면 update, 없으면 create)

### 주요 설계 선택

| 항목 | 선택 | 이유 |
|---|---|---|
| 데이터 파싱 | `JsonNode` 직접 파싱, 중간 DTO 없음 | MLB API 응답 구조가 복잡하여 중간 DTO보다 유연한 JsonNode가 적합 |
| externalId | `"MLB-" + gamePk` | 다른 스포츠 externalId와 충돌 방지 |
| 인증 | `requireAdmin(session)` | Spring Security 미사용 원칙 유지 |

### 구현 제외 범위
선수 통계, 스트라이크존, 라이브 투구 추적, AI 예측

### 엔드포인트
```
POST /api/admin/mlb/sync/schedule
```

---

## Phase 2A — 자동 동기화 + 경기 목록 섹션 (2026-05-19)

### 목표
관리자 수동 동기화 외에 서버 스케줄러 기반 자동 동기화 추가, 경기 목록 상단에 라이브·종료·예정 경기 섹션 표시

### 아키텍처 결정
- `@EnableScheduling` + `MlbScheduledSyncService` 분리
- 두 가지 동기화 주기:
  - 매일 새벽 3시: `-2일 ~ +7일` (결과 및 예정 경기)
  - 매 5분: `-1일 ~ +1일` (라이브 스코어 갱신)
- `GET /api/matches/sections` 신규 엔드포인트 (sportType 선택적 필터)

### 주요 설계 선택

| 항목 | 선택 | 이유 |
|---|---|---|
| 동기화 주기 | 새벽 3시 + 5분 인터벌 | 일별 결과와 실시간 라이브 스코어를 모두 커버 |
| 스케줄러 에러 처리 | Exception catch 후 로그만 출력 | 스케줄러가 한 번 실패해도 다음 실행에 영향 없도록 |
| 섹션 데이터 | `liveMatches`, `recentFinishedMatches`, `upcomingMatches` 각 최대 6개 | 화면 공간 고려 |

### 엔드포인트
```
GET /api/matches/sections?sportType=BASEBALL
```

---

## Phase 2B — 가로 캐러셀 UI (2026-05-19)

### 목표
경기 목록 섹션을 세로 그리드에서 가로 캐러셀로 변경, MLB 필터 시 KBO 샘플 경기 제외

### 아키텍처 결정
- 외부 carousel 라이브러리 미사용 → CSS `overflow-x: auto` + `scrollBy` + `useRef` 방식
- `leagueName` 파라미터를 `GET /api/matches/sections`에 추가
- `MatchCard`에 `compact` prop 추가 (기존 full 카드 레이아웃 변경 없음)

### 주요 설계 선택

| 항목 | 선택 | 이유 |
|---|---|---|
| 캐러셀 구현 | 네이티브 스크롤 + JS scrollBy | 외부 라이브러리 번들 크기 증가 방지 |
| MLB 필터 | `leagueName=MLB` 파라미터 | BASEBALL 종목에 KBO 샘플 데이터가 섞이는 문제 해결 |
| 화살표 비활성화 | scroll 이벤트로 canScrollLeft/Right 추적 | 더 이상 스크롤 불가한 방향 화살표 시각적 피드백 |

---

## Phase 2C — 팀 로고·약어 표시 (2026-05-19)

### 목표
compact 카드에서 긴 팀명 대신 로고 이미지 + 약어(3글자) 표시

### 아키텍처 결정
- 로고 이미지를 DB에 저장하지 않고 URL만 저장 (`Team.logoUrl`)
- MLB 공개 CDN URL 사용: `https://midfield.mlbstatic.com/v1/team/{teamId}/spots/96`
- 이미지 로드 실패 시 약어 fallback (onError 처리)
- 기존 팀의 logoUrl이 null이면 다음 동기화 때 backfill

### 주요 설계 선택

| 항목 | 선택 | 이유 |
|---|---|---|
| 로고 저장 방식 | URL만 저장 | 이미지 파일 저장 시 스토리지 및 저작권 문제 발생 |
| Fallback | 약어 텍스트 원형 뱃지 | 로고 없어도 팀 식별 가능 |

---

## Phase 3A — MLB 경기 상세 (이닝 스코어·라인업·박스스코어) (2026-05-20)

### 목표
MLB 경기 상세 페이지에 이닝별 점수(linescore), 라인업, 타자·투수 기록 표시

### 사전 확인 (팀원이 MLB API 응답 직접 검사)
- `probablePitchers`, `linescore`, `homeLineupCount`, `awayLineupCount` 데이터 존재 확인
- 타자/투수 stat 필드 구조 확인 후 구현 착수

### 아키텍처 결정
- 전체 MLB JSON을 그대로 프론트로 반환하지 않음 → 필요한 필드만 파싱한 DTO 반환
- non-MLB 경기 상세 페이지 기존 동작 완전 유지
- 독립적인 `baseball` 패키지 내 처리

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `MlbLinescoreTable` | 이닝별 점수 + R/H/E |
| `MlbLineupTable` | 타순·선수명·포지션 |
| `MlbBoxscoreTable` | 타자/투수 개인 기록 |

### 엔드포인트
```
GET /api/matches/{matchId}/mlb-detail
```

---

## Phase 3B — 문자중계 Play-by-Play (2026-05-20)

### 목표
이닝별 플레이 결과 표시, 라이브 경기는 30초 자동 갱신

### 아키텍처 결정
- 기존 MLB detail 엔드포인트와 **분리된 독립 엔드포인트** 선택
  - 이유: play-by-play만 독립적으로 폴링 가능, 기존 코드 변경 최소화
- `AbortController`로 언마운트 시 요청 취소 (메모리 누수 방지)
- FINAL/SCHEDULED 경기: 최초 1회만 조회, LIVE만 30초 폴링

### 주요 설계 선택

| 항목 | 선택 | 이유 |
|---|---|---|
| 폴링 방식 | setInterval 30초 | WebSocket 대비 구현 복잡도 낮음, 중계 특성상 30초 간격으로 충분 |
| 에러 처리 | silent fail (기존 plays 유지) | 일시적 API 오류로 화면이 빠지지 않도록 |

### 엔드포인트
```
GET /api/matches/{matchId}/mlb-play-by-play
```

---

## Phase 3C — 탭 레이아웃 (2026-05-20)

### 목표
MLB 상세 페이지 세로 스크롤 → 네이버 스포츠 스타일 탭 UI로 개편

### 아키텍처 결정
- `TabBar.jsx`: 탭 버튼 목록만 렌더링하는 순수 표현 컴포넌트 (상태 없음)
- `MatchDetailPage`에 `activeTab` 상태 추가
- `isMlb` 조건으로 MLB/비MLB 레이아웃 완전 분리 (비MLB 기존 레이아웃 유지)

### 탭 구성
```
팬존 | 라인업 | 기록 | 중계 | 존 차트 | 분석
```

### 주요 설계 선택

| 항목 | 선택 | 이유 |
|---|---|---|
| 탭 상태 위치 | MatchDetailPage (부모) | TabBar는 재사용 가능한 표현 컴포넌트로 유지 |
| 비MLB 처리 | isMlb 조건으로 분기 | 비MLB 페이지 레이아웃 완전 보존 |

---

## Phase 3D — 투구 존 차트 (2026-05-20)

### 목표
투구 좌표(plateX, plateZ)를 SVG 스트라이크존 위에 시각화, 투수·타자·이닝 필터 제공

### 사전 확인 (팀원이 pitchData 직접 검사)
```
totalPitches: 271 / pitchesWithCoordinates: 271
plateX, plateZ, strikeZoneTop, strikeZoneBottom, zone, pitchType 존재 확인
```

### 아키텍처 결정
- SVG 사용 (Canvas 대비 DOM 접근 용이, hover/click 이벤트 처리 자연스러움)
- 좌표 변환 함수: `svgX(px)`, `svgY(pz)` — 도메인 범위를 SVG 픽셀 범위로 선형 변환
- 필터 옵션 목록: 필터 적용 후가 아닌 **전체 pitches 기준** 생성 (필터링 시 옵션 목록 축소 방지)
- pitch 분류 우선순위: `inPlay > strike > ball`

### SVG 좌표계

| 축 | 실제 범위 | SVG 범위 |
|---|---|---|
| X (plateX) | −2.0 ~ +2.0 | 20 ~ 280 |
| Y (plateZ, 반전) | 5.0 ~ 0.5 | 20 ~ 330 |

### 구현 제외 범위
Hot/Cold Zone 히트맵, 뉴스/기사

### 엔드포인트
```
GET /api/matches/{matchId}/mlb-pitch-zone
```

---

## MLB 분析 탭 (2026-05-25)

### 목표
직접 계산한 수치 지표(승률·투수 효율·핵심 타자·이닝 흐름)와 Gemini 생성 문구를 분析 탭에 표시

### 아키텍처 결정
- 기존 범용 `AnalysisService` 대신 MLB 전용 `MlbAnalysisService` 신설
- 수치 지표 먼저 계산 → Gemini에 수치 포함한 프롬프트 전달 (수치 재계산 금지 지시)
- Gemini 실패해도 수치 지표는 항상 반환 (에러 노출 없음)
- DB 캐싱 없음, 매 요청마다 실시간 계산

### 승률 계산 공식
```
progress = min(currentInning, 9) / 9.0
weight   = 0.3 + (0.7 × progress)
base     = 50 + (scoreDiff × 10 × weight)

보정: 선발 ERA > 5.00 → ±3, 에러 1개당 → ∓2

homeProb = clamp(base, 5, 95)
awayProb = 100 - homeProb
```

### 에러 처리

| 상황 | 처리 |
|---|---|
| MLB 경기 아님 | 404 반환 |
| linescore/boxscore 없음 | 승률 50:50 기본값 반환 |
| Gemini 실패 | analysis 필드 빈 문자열, 수치는 정상 반환 |
| 프론트 API 실패 | 분析 탭 내 에러 표시, 다른 탭 영향 없음 |

### 엔드포인트
```
GET /api/matches/{matchId}/mlb-analysis
```

---

## MLB API 엔드포인트 전체 목록

| 엔드포인트 | 설명 | 인증 |
|---|---|---|
| `POST /api/admin/mlb/sync/schedule` | 관리자 수동 동기화 | ADMIN |
| `GET /api/matches/sections` | 라이브·종료·예정 경기 섹션 | 없음 |
| `GET /api/matches/{id}/mlb-detail` | 라인업·박스스코어·이닝 스코어 | 없음 |
| `GET /api/matches/{id}/mlb-play-by-play` | 이닝별 문자중계 | 없음 |
| `GET /api/matches/{id}/mlb-pitch-zone` | 투구 좌표 데이터 | 없음 |
| `GET /api/matches/{id}/mlb-analysis` | 수치 지표 + Gemini 분析 | 없음 |

---

## 원본 파일 위치

| 파일 | 내용 |
|---|---|
| `docs/superpowers/specs/2026-05-19-mlb-sync-design.md` | Phase 1 동기화 |
| `docs/superpowers/specs/2026-05-19-mlb-phase2a-design.md` | Phase 2A 자동 동기화 |
| `docs/superpowers/specs/2026-05-19-mlb-phase2b-design.md` | Phase 2B 캐러셀 |
| `docs/superpowers/specs/2026-05-19-mlb-phase2c-design.md` | Phase 2C 팀 로고 |
| `docs/superpowers/specs/2026-05-20-mlb-pitch-inspect-design.md` | pitchData 필드 확인 |
| `docs/superpowers/specs/2026-05-20-mlb-play-by-play-design.md` | Phase 3B 문자중계 |
| `docs/superpowers/specs/2026-05-20-mlb-strike-zone-design.md` | Phase 3D 존 차트 |
| `docs/superpowers/specs/2026-05-20-mlb-tab-layout-design.md` | Phase 3C 탭 UI |
| `docs/superpowers/specs/2026-05-25-mlb-analysis-design.md` | MLB 분析 탭 |
