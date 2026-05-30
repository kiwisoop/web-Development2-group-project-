# E스포츠(LCK) 기능 프롬프트 로그

이 문서는 Sport Analysis Dashboard 프로젝트에서 **E스포츠(LCK) 전용 기능**을 구현할 때 사용한 프롬프트의 목적, 요약, 기대 결과, 실제 결과, 채택 여부, 후속 조치를 정리합니다. 보고서의 AI 활용 투명성, 프롬프트 엔지니어링, 팀원별 기여도 증거로 활용합니다.

- 담당: 김우림
- 대상 모듈: `src/main/java/com/sport/web_sport/esports/`, `frontend/src/pages/EsportsPage.jsx`, `frontend/src/api/lckApi.js`
- 주요 외부 연동: Cito API, Groq API

---

## E-1. LCK 도메인 모델 및 DB 기반 조회 구조

- **목적:**  
  LCK 경기, 세트별 게임, 선수 경기 지표, 팀 경기 지표, 타임라인 데이터를 Spring Boot에서 조회할 수 있는 구조 마련

- **프롬프트 요약:**  
  LCK 경기/게임/선수 통계 데이터를 `entity`, `repository`, `service`, `controller`, `dto`로 분리하고, React에서 필요한 응답 구조를 만들도록 요청

- **기대 결과:**  
  `/api/lck/matches`, `/api/lck/matches/{matchId}/games`, `/api/lck/games/{gameId}`로 LCK 경기와 게임 상세를 조회

- **실제 결과:**  
  `Game`, `PlayerGameStat`, `TeamGameStat`, `LckTimelineEvent`, `LckAnalysisResult` 엔티티와 관련 Repository 구성.  
  `LckDataService`에서 매치별 게임 목록, 게임 상세, 선수 통계, 팀 통계를 DTO로 변환

- **채택 여부:** 채택

- **후속 조치:**  
  선수 시즌 요약과 경기별 상세 지표 API 추가

---

## E-2. LCK 팀/선수 및 선수 지표 API

- **목적:**  
  E스포츠 페이지에서 팀 목록, 선수 목록, 선수 시즌별 KDA 요약, 경기별 상세 지표를 확인할 수 있도록 API 확장

- **프롬프트 요약:**  
  팀별 선수 조회, 선수 시즌 통합 KDA, 경기별 DPM/골드/시야/데미지 비율 조회 엔드포인트를 설계하고 DTO로 반환하도록 요청

- **기대 결과:**  
  사용자가 LCK 팀과 선수의 성과 지표를 비교할 수 있음

- **실제 결과:**  
  `GET /api/lck/teams`, `GET /api/lck/teams/{teamId}/players`, `GET /api/lck/players/{playerId}/season-summary`, `GET /api/lck/players/{playerId}/game-stats` 구현.  
  프론트엔드 `PlayerStatsModal`에서 선수 상세 지표 표시

- **채택 여부:** 채택

- **후속 조치:**  
  Cito API 기반 최신 경기 일정/순위 연동

---

## E-3. Cito API 프록시 연동

- **목적:**  
  LCK 최신 시즌, 경기 일정, 순위, 오늘 경기, 게임별 팀 통계를 외부 API에서 가져와 화면에 표시

- **프롬프트 요약:**  
  Cito API 호출을 백엔드에서 프록시하고, 프론트엔드는 `lckApi.js`를 통해 일정/순위/오늘 경기/게임별 통계를 요청하도록 구성

- **기대 결과:**  
  React에서 외부 API 키나 호출 로직을 직접 노출하지 않고, 백엔드를 통해 안정적으로 LCK 데이터를 조회

- **실제 결과:**  
  `CitoApiService`와 `LckController`의 `/api/lck/cito/*` 엔드포인트 구현.  
  `frontend/src/api/lckApi.js`에 `getCitoSeasons`, `getCitoMatches`, `getCitoStandings`, `getCitoToday`, `getCitoMatchGames` 추가

- **채택 여부:** 채택

- **후속 조치:**  
  Cito 경기 맥락과 DB 선수 지표를 결합한 AI 분석 기능 추가

---

## E-4. LCK AI 경기 분석

- **목적:**  
  Cito 경기 정보와 DB 선수 KDA/데미지 기여도를 바탕으로 LCK 경기 요약, 전술 분석, 핵심 포인트를 생성

- **프롬프트 요약:**  
  `LckCitoAnalysisRequest`를 입력으로 받아 팀명, 세트 스코어, 경기 날짜, 최근 게임별 선수 지표를 프롬프트에 포함하고, AI 응답을 `{summary, tactical, keyPoint}` JSON 구조로 반환하도록 요청

- **기대 결과:**  
  단순 경기 결과가 아니라 선수 지표와 팀 통계를 반영한 한국어 분석 제공

- **실제 결과:**  
  `LckGroqService`에서 Groq Chat Completions API 호출 구현.  
  `POST /api/lck/cito/match/analyze` 엔드포인트와 `generateLckMatchAnalysis()` 프론트엔드 API 연결.  
  `EsportsPage.jsx`의 분석 패널에서 로딩, 실패, 재생성 상태 처리

- **채택 여부:** 채택

- **후속 조치:**  
  API 키 미설정 시 오류 메시지 표시와 재시도 버튼 제공

---

## E-5. E스포츠 통합 페이지 UI

- **목적:**  
  LCK 일정, 순위, 팀/선수 정보, 게임별 팀 통계, AI 분석을 한 화면에서 탐색할 수 있는 페이지 구성

- **프롬프트 요약:**  
  `EsportsPage.jsx`에서 Cito API 데이터와 DB 기반 팀/선수 데이터를 함께 사용하고, 로딩/에러/빈 상태를 공통 컴포넌트로 처리하도록 요청

- **기대 결과:**  
  사용자가 LCK 최신 경기 흐름과 선수 지표를 시각적으로 확인하고, 경기별 AI 요약을 생성할 수 있음

- **실제 결과:**  
  `EsportsPage.jsx`에 팀 로고 fallback, 경기 상태 배지, 게임별 접이식 통계 블록, 선수 지표 모달, AI 분석 패널 구현.  
  `LoadingState`, `ErrorBox`, `EmptyState` 공통 컴포넌트 재사용

- **채택 여부:** 채택

- **후속 조치:**  
  모바일 화면에서 긴 통계 표가 깨지지 않는지 최종 시연 전 점검 필요

---

## E-6. 검증 및 제한조건

| 항목 | 내용 |
|---|---|
| 데이터 출처 | DB 초기 데이터 + Cito API |
| AI 제공자 | Groq API (`GROQ_API_KEY` 필요) |
| 오류 처리 | 외부 API 실패 시 503 또는 화면 오류 상태 표시 |
| 개인정보 | AI 프롬프트에는 경기/선수 공개 지표만 포함 |
| 성능 고려 | 선수 지표는 최근 경기 중심으로 제한해 프롬프트 길이와 응답 시간을 관리 |
| 향후 개선 | E스포츠 전용 테스트 케이스와 화면 캡처 증거 추가 |

## E스포츠 기능 전용 API 목록

| 경로 | 설명 |
|---|---|
| `GET /api/lck/matches` | LCK 경기 목록 |
| `GET /api/lck/matches/{matchId}/games` | 매치에 포함된 게임 목록 |
| `GET /api/lck/games/{gameId}` | 게임 상세 통계/타임라인 |
| `GET /api/lck/teams` | LCK 팀 목록 |
| `GET /api/lck/teams/{teamId}/players` | 팀별 선수 목록 |
| `GET /api/lck/players/{playerId}/season-summary` | 선수 시즌별 KDA 요약 |
| `GET /api/lck/players/{playerId}/game-stats` | 선수 경기별 상세 지표 |
| `GET /api/lck/cito/seasons` | 지원 시즌 목록 |
| `GET /api/lck/cito/matches` | 날짜 범위별 Cito 경기 조회 |
| `GET /api/lck/cito/standings/{tournamentId}` | Cito 순위표 |
| `GET /api/lck/cito/today` | 오늘 예정 경기 |
| `GET /api/lck/cito/match-games/{matchId}` | Cito 게임별 팀 통계 |
| `POST /api/lck/cito/match/analyze` | AI 경기 분석 생성 |
