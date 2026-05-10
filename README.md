# web-Development2-group-project- 웹 프로그래밍 2 프로젝트

## Sports Analysis & Summary Website

다섯 종목(축구 / 배구 / 농구 / e스포츠 / 야구)에 대해 경기 목록, 상세, 통계, 이벤트 타임라인, AI 요약, 관심 팀 기능을 제공하는 웹 서비스. 야구 모듈은 실제 MLB Stats API와 Google Gemini API에 연동된다.

## Purpose
- **React + Spring Boot REST API** 기반의 실제 서비스 형태 아키텍처를 학습한다.
- 레이어별이 아니라 **종목별 풀스택 플로우**로 작업을 분담한다.
- 가짜 데이터 위에서 시작해, 야구 모듈에서는 실제 외부 API(MLB Stats API)와 실제 LLM(Gemini)까지 통합한다.

## Tech Stack

**Backend**
- Java 17
- Spring Boot 3.5.14
- Spring Web, Spring Data JPA, Validation
- Lombok
- H2 (개발 기본), MySQL Connector/J (운영 전환용)
- Jackson (MLB / Gemini JSON 파싱)
- `RestTemplate` 기반 외부 API 클라이언트

**Frontend**
- React 19 + Vite 8
- JavaScript, CSS
- axios (REST), react-router-dom 6 (routing)

**External services (BASEBALL 모듈만 해당)**
- [MLB Stats API](https://statsapi.mlb.com/) — 일정, 라이브 피드, 순위, 리그 리더, 팀 스탯
- Google Gemini API (`gemini-2.5-flash`) — 경기 AI 요약

## Team Development Rule

작업은 백엔드 / 프런트엔드 / DB로 나누지 않고 **종목 모듈**별로 나눈다. 한 명이 한 종목의 **전체 흐름(UI + API + 데이터 + AI 요약)** 을 담당하고, 공용 뼈대(엔티티, REST API, 라우팅, 공통 컴포넌트, AnalysisGenerator 인터페이스)는 한 번만 만든다.

| Member | Sport |
|---|---|
| 1 | SOCCER (reference module) |
| 2 | VOLLEYBALL |
| 3 | BASKETBALL |
| 4 | ESPORTS |
| 5 | BASEBALL (MLB Stats API + Gemini AI) |

## Folder Structure

```
sports-analysis/
├─ backend/
│  └─ src/main/java/com/team/sportsanalysis/
│     ├─ Application.java
│     ├─ common/        # CorsConfig, SportType (SOCCER/VOLLEYBALL/BASKETBALL/ESPORTS/BASEBALL)
│     ├─ user/          # User, UserRepository, AuthController (register/login)
│     ├─ sport/         # SportController (/api/sports)
│     ├─ match/         # Match, MatchStat, MatchEvent, Team + repos + MatchController
│     ├─ analysis/      # MatchAnalysis, AnalysisGenerator, MockAnalysisGenerator,
│     │                 #   AnalysisController (네 종목용 룰 기반 요약)
│     ├─ favorite/      # FavoriteTeam + FavoriteController (CRUD)
│     └─ mlb/           # MLB 통합 모듈
│        ├─ MlbClient            # MLB Stats API HTTP 호출 (RestTemplate)
│        ├─ MlbService           # 일정 / 라이브피드 JSON → DTO 파싱
│        ├─ MlbController        # /api/mlb/schedule, /game/{pk}, summary endpoints
│        ├─ BaseballSummaryService  # Mock + Gemini(gemini-2.5-flash) 요약 생성, compare
│        ├─ MlbGame / MlbGameDetail / MlbInningScore / MlbGameEvent / BaseballSummaryResponse
│        └─ records/             # 시즌 기록 모듈
│           ├─ MlbRecordsClient (MlbClient 재사용)
│           ├─ MlbRecordsService (standings, leaders, team stats)
│           ├─ MlbRecordsController (/api/mlb/records/...)
│           └─ MlbStandingTeam / MlbStatLeader / MlbLeaderGroup /
│              MlbTeamStatRow / MlbTeamRecordCard /
│              MlbRecordsDashboard / MlbTeamStatsDashboard
│  └─ src/main/resources/
│     ├─ application.properties  # H2, JPA, server.port=8080, mlb.base-url, GEMINI_API_KEY
│     └─ data.sql                # SOCCER(3경기 + 통계/이벤트) / 다른 3종목(3경기 기본 정보) + demo 유저
└─ frontend/
   └─ src/
      ├─ api/           # axios clients: sports, matches, analysis, favorites, auth, mlb
      ├─ components/    # NavBar, MatchCard, StatsTable, EventTimeline, AISummaryCard,
      │                 #   SportMatchList,
      │                 #   BaseballScoreboard, BaseballEventTimeline,
      │                 #   BaseballSummaryCompareCard, MlbTeamStatsTable
      ├─ pages/         # HomePage, LoginPage, RegisterPage,
      │                 #   SoccerPage, VolleyballPage, BasketballPage, EsportsPage,
      │                 #   BaseballPage (월간 캘린더),
      │                 #   BaseballDetailPage (이닝 스코어보드 + 이벤트 + AI 비교),
      │                 #   BaseballRecordsPage (순위 / 팀 기록 / 타자·투수 리더 / 팀스탯),
      │                 #   MatchDetailPage, FavoriteTeamsPage
      ├─ routes/        # AppRouter (/, /login, /register, /soccer, /volleyball, /basketball,
      │                 #   /esports, /baseball, /baseball/records, /baseball/:gamePk,
      │                 #   /matches/:id, /favorites)
      └─ styles/        # app.css
```

## Run

### Backend (port 8080)

루트에서 Maven Wrapper로 실행한다.

```bash
cd backend
./mvnw spring-boot:run
```

Windows PowerShell:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

#### Gemini API 키 설정 (야구 AI 요약 사용 시)

`/api/mlb/game/{gamePk}/summary/gemini` 와 `/summary/compare` 의 Gemini 응답을 받으려면 `GEMINI_API_KEY` 환경 변수(또는 동일 이름의 Spring 프로퍼티)를 설정해야 한다. 미설정 시 Gemini 응답에는 에러 메시지가 담기고, Mock 요약은 정상 동작한다.

PowerShell:
```powershell
$env:GEMINI_API_KEY = "..."
.\mvnw.cmd spring-boot:run
```

bash:
```bash
export GEMINI_API_KEY=...
./mvnw spring-boot:run
```

### Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```

## Test URLs

- Frontend: http://localhost:5173
- Backend API root: http://localhost:8080/api
- H2 console: http://localhost:8080/h2-console
  - JDBC URL `jdbc:h2:mem:sportsdb`, user `sa`, no password
- Quick API checks:
  - http://localhost:8080/api/sports
  - http://localhost:8080/api/matches?sportType=SOCCER
  - http://localhost:8080/api/matches/1
  - http://localhost:8080/api/matches/1/stats
  - http://localhost:8080/api/matches/1/events
  - http://localhost:8080/api/mlb/schedule
  - http://localhost:8080/api/mlb/schedule/month?year=2025&month=10
  - http://localhost:8080/api/mlb/records/dashboard
  - http://localhost:8080/api/mlb/records/team-stats

## Implemented Features

### 공용 (Soccer / Volleyball / Basketball / Esports)
- 홈 화면: 종목 카드, 최근 경기 목록, 기능 소개 카드
- 종목별 페이지: 경기 목록 (리그, 일시, 팀, 점수, 상태, 상세 버튼)
- 경기 상세 페이지: 기본 정보 + 점수, 통계 테이블, 이벤트 타임라인, AI 요약 카드, 관심 팀 추가 버튼
- **AnalysisGenerator** 인터페이스 + **MockAnalysisGenerator** — 매치/통계/이벤트로부터 자연어 요약을 만든다. 추후 실제 LLM 구현체로 교체 가능
- 관심 팀 (등록/목록/삭제)
- Spring Security 없는 단순 회원가입 / 로그인 (스펙 그대로)
- React dev 서버(5173, 3000) 대상 CORS 설정
- H2 인메모리 DB + `data.sql` 시드: 종목별 3경기, **축구만** 통계/이벤트까지 포함

### Baseball (MLB) 모듈 — 실서비스급 통합
- **월간 일정 캘린더**: MLB Stats API `/schedule` 를 startDate–endDate 범위로 호출, 일자별로 그룹핑해 보여줌
- **일정 상태 배지**: Scheduled / Pre-Game / Live / Final
- **경기 상세**: `/api/v1.1/game/{gamePk}/feed/live` 라이브 피드 → 점수 / R·H·E / 이닝별 스코어보드 / 플레이바이플레이
- **AI 요약 비교 카드 (`BaseballSummaryCompareCard`)**: Mock(룰 기반) vs Gemini(`gemini-2.5-flash`) 결과를 한 화면에서 비교. Gemini 응답은 `summaryText / tacticalAnalysis / keyPoint` JSON으로 강제 파싱
- **기록 페이지** (`/baseball/records`): 시즌 선택, 4개 탭
  - **Team Standings** — 디비전별 W/L, 승률, GB, RS/RA/Diff, 연승
  - **Team Records** — 최고 승률 / 최다 승 / 최고 득실차 / 최다 득점 / 최소 실점 카드
  - **Hitter Records** — AVG, HR, RBI, H, SB, OPS 카테고리별 리더보드
  - **Pitcher Records** — ERA, W, K, SV, WHIP 리더보드
  - **Team Stats** (별도 표) — Batting/Pitching/Fielding 팀 시즌 스탯 테이블
- 관심 팀 기능에서 MLB 팀 이름도 함께 등록 가능

## API List

### 공용
| Method | Path | Description |
|---|---|---|
| GET | `/api/sports` | 모든 SportType 열거 (BASEBALL 포함) |
| GET | `/api/matches?sportType=SOCCER` | 종목별 경기 목록 (파라미터 생략 시 최근 6경기) |
| GET | `/api/matches/{id}` | 경기 상세 |
| GET | `/api/matches/{id}/stats` | 경기 통계 |
| GET | `/api/matches/{id}/events` | 경기 이벤트 타임라인 |
| GET | `/api/matches/{id}/analysis` | 저장된 AI 요약 조회 |
| POST | `/api/matches/{id}/analysis` | Mock AI 요약 생성/재생성 |
| GET | `/api/favorites/teams?userId=` | 관심 팀 목록 |
| POST | `/api/favorites/teams` | 관심 팀 추가 (`userId`, `sportType`, `teamName`) |
| DELETE | `/api/favorites/teams/{id}` | 관심 팀 삭제 |
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |

### MLB (Baseball)
| Method | Path | Description |
|---|---|---|
| GET | `/api/mlb/schedule?date=YYYY-MM-DD` | 특정 일자의 MLB 경기 (생략 시 오늘) |
| GET | `/api/mlb/schedule/month?year=&month=` | 월 단위 경기 일정 |
| GET | `/api/mlb/game/{gamePk}` | 경기 상세 (라인스코어, 이닝, 주요 플레이) |
| GET | `/api/mlb/game/{gamePk}/summary/mock` | 룰 기반 Mock 요약 |
| GET | `/api/mlb/game/{gamePk}/summary/gemini` | Gemini AI 요약 (`GEMINI_API_KEY` 필요) |
| GET | `/api/mlb/game/{gamePk}/summary/compare` | Mock + Gemini 동시 반환 (`{ mock, gemini }`) |
| GET | `/api/mlb/records/standings?season=` | 시즌 순위 (AL+NL) |
| GET | `/api/mlb/records/leaders/hitting?season=&limit=10` | 타자 카테고리(AVG/HR/RBI/H/SB/OPS) 리더 |
| GET | `/api/mlb/records/leaders/pitching?season=&limit=10` | 투수 카테고리(ERA/W/K/SV/WHIP) 리더 |
| GET | `/api/mlb/records/dashboard?season=&limit=10` | 순위 + 팀 기록 카드 + 타자/투수 리더 통합 |
| GET | `/api/mlb/records/team-stats?season=` | Batting/Pitching/Fielding 팀 시즌 스탯 |

`season` 파라미터를 생략하면 현재 연도가 사용된다.

## Sample Login Account

| Field | Value |
|---|---|
| username | `demo` |
| password | `demo123` |

(`data.sql` 에서 백엔드 시작 시 자동 생성.)

## BASEBALL Module — Status

`feature/baseball` 브랜치에서 구현되었다.

**Done**
- MLB Stats API 통합 (`MlbClient` + `MlbService`): 일정 / 월간 일정 / 라이브 피드 / 순위 / 팀 스탯 / 리그 리더
- 이닝별 스코어보드 + 주요 플레이(scoring plays 우선, 없으면 최근 10개) 타임라인
- Gemini 기반 `BaseballSummaryService`, Mock vs Gemini compare 엔드포인트
- 시즌 기록 페이지 (Standings / 팀 기록 카드 / 타자·투수 리더 / 팀 시즌 스탯)
- 관심 팀에서 MLB 팀 이름 지원

**Configuration**
- `GEMINI_API_KEY` 환경 변수(또는 동명 프로퍼티) 설정 시 Gemini 요약이 활성화된다. 미설정 시 `summary/gemini` 는 에러 메시지를 담은 응답을 반환하지만 Mock 요약과 다른 모든 기능은 정상 동작한다.
- `mlb.base-url` 프로퍼티로 MLB API 베이스 URL을 바꿀 수 있다 (기본 `https://statsapi.mlb.com/api/v1`).

**Not yet implemented (future ideas)**
- 진행 중 경기의 자동 갱신(폴링/SSE) 라이브 스코어보드
- 매치별 실시간 팬 채팅 (WebSocket)
- 투구별 스트라이크존 시각화
- Hit-risk / xBA 류의 안타 확률 모델을 경기 상세에 노출
