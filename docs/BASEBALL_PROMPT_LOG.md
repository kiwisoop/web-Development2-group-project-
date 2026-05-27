# 야구(MLB) 기능 프롬프트 로그

이 문서는 Sport Analysis Dashboard 프로젝트에서 **MLB(메이저리그 야구) 전용 기능**을 구현할 때 사용한 프롬프트의 목적, 요약, 기대 결과, 실제 결과, 채택 여부, 후속 조치를 기록합니다.

---

## B-1. MLB 경기 상세 데이터 API 연동 (MLB Game Detail API)

- **목적:**  
  MLB 경기의 상세 데이터(선발 투수, 라인업, 박스스코어, 이닝별 점수)를 외부 MLB Stats API에서 가져와 백엔드에서 가공·제공

- **프롬프트 요약:**  
  `GET /api/mlb/games/{matchId}` 엔드포인트 구현 요청.  
  응답 필드: 홈/원정 팀명·약칭·로고 URL, 선발 투수명(`homeProbablePitcher`, `awayProbablePitcher`), 이닝별 점수(`linescore`), 라인업(`homeLineup`, `awayLineup`), 투수 성적(`homePitchers`, `awayPitchers`), 타자 성적(`homeBatters`, `awayBatters`)

- **기대 결과:**  
  React에서 MLB 경기 전용 상세 탭 화면을 구성할 수 있는 데이터 구조 확보

- **실제 결과:**  
  `MlbGameDetailResponse` DTO 및 `MlbApiService`, `MlbController` 구현.  
  프론트엔드 `src/api/mlbApi.js`에 `getMlbGameDetail()` 함수 추가

- **채택 여부:** 채택

- **후속 조치:**  
  경기 상세 페이지에 MLB 전용 탭 UI 구성

---

## B-2. MLB 탭바 및 팬존 통합 (TabBar & Fan Zone Integration)

- **목적:**  
  MLB 경기 상세 페이지에서 팬존·라인업·기록·중계·존차트·분석을 탭으로 분리하여 정보 접근성 향상

- **프롬프트 요약:**  
  `TabBar` 공통 컴포넌트 생성, `MatchDetailPage`에서 MLB 경기일 때만 탭 UI 표시 요청.  
  탭 목록: `['팬존', '라인업', '기록', '중계', '존 차트', '분석']`.  
  비MLB 경기는 기존 단일 페이지 레이아웃 유지

- **기대 결과:**  
  MLB 경기 상세 페이지에서 탭 클릭으로 각 섹션 전환 가능

- **실제 결과:**  
  `TabBar.jsx` 생성(탭 이름 배열 + `activeTab`/`onTabChange` props).  
  `MatchDetailPage.jsx`에 `isMlb` 분기 로직 추가하여 MLB/비MLB 레이아웃 분리

- **채택 여부:** 채택

- **후속 조치:**  
  각 탭별 컴포넌트 구현

---

## B-3. 이닝별 점수판 (MlbLinescoreTable)

- **목적:**  
  MLB 경기의 이닝별 득점, R/H/E(득점/안타/실책)를 표 형태로 표시

- **프롬프트 요약:**  
  `MlbLinescoreTable` 컴포넌트 생성 요청.  
  백엔드 `linescore` 응답(이닝 배열, 홈/원정 R·H·E)을 기반으로 이닝 열 동적 생성.  
  진행 중이거나 아직 플레이되지 않은 이닝은 `-`로 표시

- **기대 결과:**  
  실제 야구 중계 화면처럼 이닝별 점수 한눈에 확인 가능

- **실제 결과:**  
  `MlbLinescoreTable.jsx` 구현, MLB 팬존 탭 상단 카드에 배치.  
  팀 약칭(`homeShortName`, `awayShortName`) props로 행 레이블 표시

- **채택 여부:** 채택

- **후속 조치:**  
  라인업 탭 구현

---

## B-4. 라인업 테이블 (MlbLineupTable)

- **목적:**  
  홈/원정 팀의 선발 라인업(타순·선수명·포지션)을 나란히 표시

- **프롬프트 요약:**  
  `MlbLineupTable` 컴포넌트 생성 요청.  
  `lineup` 배열(각 항목: `battingOrder`, `fullName`, `position`) 기반으로 타순 정렬 표 렌더링.  
  홈/원정 두 테이블을 `mlb-lineup-grid` CSS 그리드로 나란히 배치

- **기대 결과:**  
  라인업 탭에서 양 팀 선발 타순 동시 확인 가능

- **실제 결과:**  
  `MlbLineupTable.jsx` 구현, 경기 시작 전에는 "라인업 미정" 메시지 표시.  
  `MatchDetailPage` 라인업 탭에 홈·원정 테이블 병렬 배치

- **채택 여부:** 채택

- **후속 조치:**  
  박스스코어 탭 구현

---

## B-5. 박스스코어 테이블 (MlbBoxscoreTable)

- **목적:**  
  경기 결과에서 타자·투수 개인 성적을 상세 표로 제공

- **프롬프트 요약:**  
  `MlbBoxscoreTable` 컴포넌트 생성 요청.  
  타자 항목: 선수명, AB(타수), R(득점), H(안타), RBI(타점), BB(볼넷), K(삼진), AVG(타율).  
  투수 항목: 선수명, IP(이닝), H, R, ER, BB, K, ERA.  
  홈/원정 구분하여 타자→투수 순서로 표시

- **기대 결과:**  
  기록 탭에서 각 선수 개인 성적 상세 확인 가능

- **실제 결과:**  
  `MlbBoxscoreTable.jsx` 구현, 타자/투수 섹션별 소제목과 데이터 없음 처리 포함.  
  `MatchDetailPage` 기록 탭에 연결

- **채택 여부:** 채택

- **후속 조치:**  
  문자중계 탭 구현

---

## B-6. 문자중계 (MlbPlayByPlay)

- **목적:**  
  MLB 경기의 플레이별 결과(타석 결과, 득점 상황 등)를 이닝 그룹으로 표시하고, 라이브 경기는 자동 갱신

- **프롬프트 요약:**  
  `GET /api/mlb/games/{matchId}/play-by-play` 엔드포인트 구현 및 `MlbPlayByPlay` 컴포넌트 생성 요청.  
  이닝별 그룹핑, 득점 플레이 하이라이트 표시.  
  `isLive=true`일 때 30초마다 자동 갱신(`setInterval`), AbortController로 중복 요청 방지

- **기대 결과:**  
  라이브 경기에서 실시간 플레이 확인, 종료 경기에서 전체 경기 흐름 회고 가능

- **실제 결과:**  
  `MlbPlayByPlay.jsx` 구현, `controllerRef`로 이전 요청 취소 후 신규 요청.  
  이닝별 접이식 그룹, 득점 플레이에 하이라이트 클래스 적용.  
  `MatchDetailPage` 중계 탭에 연결

- **채택 여부:** 채택

- **후속 조치:**  
  존 차트 탭 구현

---

## B-7. 투구 존 차트 (MlbStrikeZoneChart)

- **목적:**  
  경기에서 발생한 모든 투구의 위치를 SVG 스트라이크 존 위에 시각화

- **프롬프트 요약:**  
  `GET /api/mlb/games/{matchId}/pitch-zone` 엔드포인트 구현 및 `MlbStrikeZoneChart` 컴포넌트 생성 요청.  
  투구 좌표(`px`, `pz`)를 SVG 좌표로 변환하여 점으로 표시.  
  스트라이크(노란색)·볼(파란색)·인플레이(초록색) 색상 구분.  
  투수 필터·타자 필터·이닝 필터 드롭다운 제공

- **기대 결과:**  
  특정 투수 또는 타자 대결에서의 투구 패턴 분석 가능

- **실제 결과:**  
  `MlbStrikeZoneChart.jsx` 구현, SVG 300×350 고정 크기로 스트라이크 존 사각형과 투구 점 렌더링.  
  필터 상태에 따라 `filteredPitches` 실시간 계산.  
  `MatchDetailPage` 존 차트 탭에 연결

- **채택 여부:** 채택

- **후속 조치:**  
  AI 분析 탭 구현

---

## B-8. MLB 경기 AI 분析 탭 (MlbAnalysisTab)

- **목적:**  
  Gemini API 기반 MLB 경기 분석 결과를 전용 탭에서 제공

- **프롬프트 요약:**  
  `GET /api/mlb/games/{matchId}/analysis` 엔드포인트 구현 및 `MlbAnalysisTab` 컴포넌트 생성 요청.  
  종료 경기에서 타자·투수 성적을 Gemini에 전달하고 분석 텍스트 생성.  
  홈팀·원정팀 이름을 props로 받아 분석 결과에 팀명 표시

- **기대 결과:**  
  경기 종료 후 AI가 주요 활약 선수, 경기 흐름, 승인 요약을 자동 생성

- **실제 결과:**  
  `MlbAnalysisTab.jsx` 구현, 로딩·에러·데이터 없음 상태 처리.  
  백엔드 `MlbAnalysisService`에서 Gemini API 호출 후 분석 텍스트 반환.  
  `MatchDetailPage` 분석 탭에 `homeTeam`, `awayTeam` props 전달

- **채택 여부:** 채택

- **후속 조치:**  
  문서화 및 최종 테스트

---

## B-9. 선발 투수 매치업 표시 (Probable Pitcher Matchup)

- **목적:**  
  경기 전/진행 중에 홈·원정 선발 투수를 양측 팀 로고와 함께 카드 형태로 표시

- **프롬프트 요약:**  
  MLB 탭 상단 요약 카드(`mlb-tab-summary`)에 선발 투수 매치업 레이아웃 추가 요청.  
  팀 로고 이미지·팀 약칭·투수명을 좌우 배치, 가운데 "VS" 텍스트.  
  `homeProbablePitcher`, `awayProbablePitcher` 값이 `-`일 경우 섹션 전체 미표시

- **기대 결과:**  
  경기 카드 상단에서 선발 투수 대결 구도를 한눈에 파악 가능

- **실제 결과:**  
  `MatchDetailPage.jsx`의 `mlb-tab-summary` 카드 내 `.mlb-pitchers-row` 레이아웃 구현.  
  `components.css`에 `.mlb-pitcher-item`, `.mlb-pitcher-logo`, `.mlb-pitcher-vs` 스타일 추가

- **채택 여부:** 채택

- **후속 조치:**  
  이닝별 점수판(`MlbLinescoreTable`)과 함께 요약 카드에 배치 완료

---

## MLB 기능 전용 API 목록

| 경로 | 설명 |
|---|---|
| `GET /api/mlb/games/{matchId}` | 경기 상세(라인업, 박스스코어, 이닝 점수, 투수) |
| `GET /api/mlb/games/{matchId}/play-by-play` | 플레이별 문자중계 |
| `GET /api/mlb/games/{matchId}/pitch-zone` | 투구 좌표 데이터 |
| `GET /api/mlb/games/{matchId}/analysis` | Gemini AI 경기 분석 |

## MLB 기능 구현 시 적용된 제약 조건

| 제약 | 내용 |
|---|---|
| 데이터 출처 | MLB Stats API (공개 API, 인증 불필요) |
| 적용 조건 | `match.sportType === 'BASEBALL'` AND `match.league.leagueName === 'MLB'`인 경우만 표시 |
| 라이브 폴링 | 문자중계만 30초 간격 자동 갱신, 나머지는 페이지 진입 시 1회 로드 |
| AI 분析 | 종료 경기(`FINAL`)에서만 분석 생성 가능 |
| 에러 처리 | MLB 데이터 로드 실패 시 해당 섹션만 에러 표시, 나머지 탭은 정상 작동 |
