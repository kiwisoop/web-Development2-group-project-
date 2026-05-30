# Sport Analysis Dashboard

React + Spring Boot + Oracle DB 기반의 스포츠 경기 분석 웹 서비스입니다. 축구, E스포츠, 야구 기능을 하나의 대시보드에 통합하고, 경기 정보 조회, 상세 데이터 분석, Groq 중심 AI 요약, 팬 예측 투표, 팬존 채팅, 관리자 대시보드를 제공합니다.

## 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | Sport Analysis Dashboard |
| 교과목 | 웹 프로그래밍 2 팀프로젝트 |
| 구조 | React SPA + Spring Boot REST API + Oracle DB |
| 주요 종목 | 축구(K리그), E스포츠(LCK), 야구(MLB) |
| AI 활용 | Claude Code 개발 보조, Groq API 중심 경기 분석 텍스트 생성 |
| 인증 | HttpSession 기반 로그인/회원가입/로그아웃 |
| 제출 증거 | README, 프롬프트 로그, 설계 문서, 최종 테스트 체크리스트 |

## 팀 역할

| 팀원 | 담당 영역 | 주요 산출물 |
|---|---|---|
| 조우성 | 축구(K리그) | K리그 데이터 수집, 축구 경기/순위 API, 축구 페이지, 축구 AI 분석 문서 |
| 김우림 | E스포츠(LCK) | LCK 팀/선수/경기 데이터, Cito API 연동, 선수 지표, E스포츠 분석 화면 |
| 최수인 | 야구(MLB) | MLB 상세 데이터, 라인업/박스스코어/문자중계/존 차트, MLB AI 분석 탭 |
| 공통 | 통합 기능 | 인증, 경기 목록/상세, 팬 투표, 팬존 채팅, 관리자 대시보드, React 전환 |

## 주요 기능

| 기능 | 설명 |
|---|---|
| 인증 | 회원가입, 로그인, 로그아웃, 세션 사용자 확인 |
| 경기 목록 | 종목, 상태, 날짜, 키워드 기준 검색/필터/페이징 |
| 경기 상세 | 스코어보드, 팀 정보, 경기 상태, 통계, 이벤트 타임라인 |
| 축구(K리그) | TheSportsDB 기반 K리그 팀/경기/순위 적재, 축구 전용 페이지, 종료 경기 AI 분석 |
| E스포츠(LCK) | LCK 팀/선수/경기 조회, 선수 시즌/경기별 지표, Cito API 프록시, 경기 맥락 AI 분석 |
| 야구(MLB) | MLB Stats API 기반 라인업, 이닝 점수, 박스스코어, 문자중계, 투구 존 차트, AI 분석 |
| 팬 예측 투표 | 경기 전 홈/원정/무승부 투표 및 비율 집계 |
| 팬존 채팅 | 경기별 DB 저장 채팅, LIVE 경기만 메시지 작성 가능 |
| 관심 팀 | 로그인 사용자별 관심 팀 등록/삭제/조회 |
| 관리자 | 통계 대시보드, 최근 경기/사용자 조회, 관리자 전용 API 테스트 |

## 기술 스택

### Frontend

| 기술 | 역할 |
|---|---|
| React 18 | UI 프레임워크 |
| Vite | 개발 서버 및 빌드 |
| React Router v7 | 클라이언트 라우팅 |
| Axios | REST API 통신 |
| CSS Modules/전역 CSS | 화면 구성 및 공통 스타일 |

### Backend

| 기술 | 역할 |
|---|---|
| Spring Boot 3.5 | REST API 서버 |
| Spring Data JPA | ORM 및 Repository |
| Oracle DB | 경기/팀/사용자/채팅/분석 데이터 저장 |
| Maven | 빌드 및 의존성 관리 |
| Groq API | 축구(K리그), E스포츠(LCK), 야구(MLB) 경기 요약 및 전술 분석 텍스트 생성 |
| Gemini API | 공통 경기 분석 레거시/보조 모듈 |
| MLB Stats API | 야구 상세 경기 데이터 |
| TheSportsDB/Cito API | 축구 및 E스포츠 데이터 연동 |

## 프로젝트 구조

```text
web-sport/
├── src/main/java/com/sport/web_sport/
│   ├── admin/       # 관리자 대시보드
│   ├── analysis/    # 공통 Gemini 분석
│   ├── baseball/    # MLB 상세 데이터/분석
│   ├── chat/        # 경기별 팬존 채팅
│   ├── common/      # 공통 응답, 예외, 타입
│   ├── esports/     # LCK/Cito API 및 E스포츠 분석
│   ├── favorite/    # 관심 팀
│   ├── prediction/  # 팬 예측 투표
│   ├── ranking/     # 종목별 순위
│   ├── recommend/   # 추천 팀
│   ├── soccer/      # K리그 데이터/API/분석
│   ├── sports/      # 공통 경기/팀/리그
│   └── user/        # 인증/사용자
├── frontend/
│   └── src/
│       ├── api/        # Axios API 함수
│       ├── components/ # 공통/종목별 컴포넌트
│       ├── pages/      # 페이지 컴포넌트
│       ├── router/     # 라우터 및 접근 제어
│       ├── hooks/      # 인증/데이터 훅
│       └── styles/     # 전역 스타일
├── docs/
│   ├── PROMPT_LOG.md
│   ├── COMMON_FEATURES_PROMPT_LOG.md
│   ├── BASEBALL_PROMPT_LOG.md
│   ├── ESPORTS_PROMPT_LOG.md
│   ├── EVALUATION_EVIDENCE_LOG.md
│   ├── FINAL_TEST_CHECKLIST.md
│   └── REACT_REST_MIGRATION_PLAN.md
├── README-soccer.md
└── README.md
```

## 실행 방법

### 1. Backend

요구사항: Java 17 이상, Oracle DB

```bash
.\mvnw.cmd spring-boot:run
```

기본 주소: `http://localhost:8080`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

개발 서버: `http://localhost:5173`

## 환경 변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `DB_URL` | `jdbc:oracle:thin:@localhost:1521/FREEPDB1` | Oracle 접속 URL |
| `DB_USERNAME` | `system` | DB 사용자명 |
| `DB_PASSWORD` | `0` | DB 비밀번호 |
| `GEMINI_API_KEY` | 없음 | Gemini API 키 |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Gemini 모델명 |
| `GROQ_API_KEY` | 없음 | LCK Groq 분석 API 키 |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq 모델명 |
| `CITO_API_KEY` | 없음 | LCK Cito API 키 |
| `CITO_API_BASE_URL` | `https://api.citoapi.com/api/v1` | Cito API 기본 주소 |
| `RIOT_API_KEY` | 없음 | Riot/LCK 데이터 소스 API 키 |

축구, E스포츠, 야구 전용 AI 분석은 `GROQ_API_KEY`가 필요합니다. `GEMINI_API_KEY`는 공통 경기 분석 레거시/보조 모듈을 시연할 때만 필요하며, API 키가 없어도 기본 조회 기능은 별도로 동작합니다.

## 테스트 계정

| 계정 | 비밀번호 | 역할 |
|---|---|---|
| `demo` | `demo123` | 일반 사용자 |
| `admin` | `admin123` | 관리자 |

## 주요 API

| 영역 | 엔드포인트 |
|---|---|
| 인증 | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| 공통 경기 | `GET /api/matches`, `GET /api/matches/{id}`, `GET /api/matches/{id}/detail-full` |
| 축구 | `GET /api/soccer/fixtures`, `GET /api/soccer/fixtures/{id}`, `GET /api/soccer/standings`, `POST /api/soccer/fixtures/{id}/analysis/generate` |
| E스포츠 | `GET /api/lck/matches`, `GET /api/lck/teams`, `GET /api/lck/games/{gameId}`, `GET /api/lck/cito/today`, `POST /api/lck/cito/match/analyze` |
| 야구 | `GET /api/mlb/games/{matchId}`, `GET /api/mlb/games/{matchId}/play-by-play`, `GET /api/mlb/games/{matchId}/pitch-zone`, `GET /api/mlb/games/{matchId}/analysis` |
| 관심 팀 | `GET /api/favorites`, `POST /api/favorites?teamId={teamId}`, `DELETE /api/favorites/{favoriteId}` |
| 팬 투표 | `GET /api/matches/{matchId}/prediction`, `POST /api/matches/{matchId}/prediction/vote` |
| 팬존 채팅 | `GET /api/matches/{matchId}/chat`, `POST /api/matches/{matchId}/chat` |
| 관리자 | `GET /api/admin/dashboard` |

## 주요 설계 결정

| 결정 | 근거 |
|---|---|
| React + REST API 분리 | 서버 렌더링보다 종목별 화면 확장과 API 재사용이 쉽다. |
| HttpSession 인증 | 팀 프로젝트 범위에서 JWT보다 구현/검증 부담이 낮고 쿠키 기반 세션으로 React 연동이 가능하다. |
| `ApiResponse<T>` 응답 통일 | 프론트엔드 에러 처리와 성공 응답 파싱을 일관화한다. |
| 종목별 패키지 분리 | 축구, E스포츠, 야구의 외부 API와 데이터 구조가 달라 독립 모듈로 유지보수한다. |
| 경기 분석 AI의 범위 제한 | Groq 중심 AI 분석은 실제 승률 예측이 아니라 경기 결과/흐름 요약에 사용하여 과장된 예측 표현을 피한다. |
| 팬 투표와 AI 분석 분리 | 사용자 의견 집계와 AI 텍스트 분석의 의미를 구분한다. |
| LIVE 경기만 채팅 작성 허용 | 경기별 팬존 목적에 맞추고 종료/취소 경기의 불필요한 입력을 제한한다. |

## 평가 기준 대응 문서

웹프로그래밍2 평가 기준은 산출물 30%, 과정 45%, 성찰/발표 25%로 구성되어 있습니다. 이 저장소에서는 다음 파일을 증거 자료로 사용합니다.

| 평가 항목 | 저장소 증거 |
|---|---|
| 시스템 완성도 | 이 README의 기능 목록, `docs/FINAL_TEST_CHECKLIST.md` |
| 아키텍처 및 설계 판단 | `docs/REACT_REST_MIGRATION_PLAN.md`, `docs/MLB_DESIGN_DOCS.md`, `README-soccer.md`, `docs/EVALUATION_EVIDENCE_LOG.md` |
| AI 활용 전략 | `docs/PROMPT_LOG.md`, `docs/COMMON_FEATURES_PROMPT_LOG.md`, `docs/BASEBALL_PROMPT_LOG.md`, `docs/ESPORTS_PROMPT_LOG.md`, `PROMPT_LOG-soccer.md` |
| 코드 검증 및 비판적 사고 | `docs/FINAL_TEST_CHECKLIST.md`, 각 프롬프트 로그의 실제 결과/후속 조치 |
| 팀워크 및 의사소통 | 이 README의 팀 역할, `docs/EVALUATION_EVIDENCE_LOG.md`, Git 커밋 이력 |
| AI 사용 투명성 | 프롬프트 로그 전체, `docs/REPORT_AI_PROMPT_SECTION.md` |
| 성찰 | 보고서 9장은 팀원이 직접 작성해야 하며 AI로 대체하지 않는다. |
| 발표 및 시연 | 실행 방법, 테스트 계정, 주요 API, 체크리스트 기반 시연 |

## 제출 전 체크리스트

1. `git status`로 불필요한 빌드 산출물, 실행 로그, 개인 설정 파일이 포함되지 않았는지 확인한다.
2. `.\mvnw.cmd test` 또는 최소 `.\mvnw.cmd compile`로 백엔드 빌드를 확인한다.
3. `cd frontend && npm run build`로 프론트엔드 빌드를 확인한다.
4. `docs/FINAL_TEST_CHECKLIST.md`의 주요 시연 경로를 직접 확인한다.
5. 보고서의 개인 성찰은 각 팀원이 직접 작성한다.
