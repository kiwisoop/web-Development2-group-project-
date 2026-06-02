# Sport Analysis Dashboard

축구, 야구, e스포츠 데이터를 한 화면에서 탐색하고 경기 상세, 순위, 즐겨찾기, 채팅, AI 분석을 제공하는 React + Spring Boot 스포츠 분석 서비스입니다.

## 현재 정리 상태

- 프론트엔드: React 19, Vite, React Router, Axios
- 백엔드: Spring Boot 3.5, Spring Data JPA, Oracle DB
- 주요 데이터: MLB Stats API, Cito LCK API, TheSportsDB/K리그 데이터
- AI 분석: Groq API 기반 경기 요약 및 전술 분석
- 인증: HttpSession 기반 로그인, 회원가입, 로그아웃, 관리자 권한

## 주요 기능

- 홈 대시보드: 실제 LIVE 경기만 진행 경기로 표시, 3일 내 예정 경기 요약
- 경기센터: 날짜/종목/상태 필터, 오늘/이전/다음 이동, 경기 상세 진입
- 경기 상세: 스코어보드, 라인스코어, 투수/타자 주요 정보, 팬 투표, 경기 채팅
- AI 분석: 분석 가능한 종료 경기만 모아 종목별 필터링
- 스포츠 허브: 축구, 야구, e스포츠 전용 화면 진입
- e스포츠: LCK 일정, 시즌별 결과, 팀/선수 정보, Cito 경기 통계, Groq 요약
- 야구: 오늘 MLB 경기, 팀 순위, 분석 리포트 진입
- 즐겨찾기: 로그인 사용자 기준 팀 저장 및 경기 일정 확인
- 설정: 프로필, 비밀번호 변경, 로그아웃/회원 탈퇴 흐름
- 관리자: 데이터 동기화, API 상태 확인, 대시보드 통계

## 프로젝트 구조

```text
web-Development2-group-project-/
├─ frontend/
│  ├─ public/                 # 정적 파일, 아이콘, 공개 이미지
│  └─ src/
│     ├─ api/                 # Axios API 클라이언트
│     ├─ assets/              # 번들에 포함되는 이미지 자산
│     ├─ components/          # 공통 UI 컴포넌트
│     ├─ data/                # 프론트 보조 데이터
│     ├─ hooks/               # 인증/데이터 훅
│     ├─ pages/               # 라우트 페이지
│     ├─ router/              # 라우팅과 보호 라우트
│     └─ styles/              # 전역/레이아웃/컴포넌트 스타일
├─ src/main/java/com/sport/web_sport/
│  ├─ admin/                  # 관리자 API
│  ├─ analysis/               # 공통 분석 모듈
│  ├─ baseball/               # MLB 상세 데이터
│  ├─ chat/                   # 경기 채팅
│  ├─ esports/                # LCK/Cito 연동
│  ├─ favorite/               # 즐겨찾기
│  ├─ prediction/             # 팬 투표
│  ├─ ranking/                # 종목별 순위
│  ├─ soccer/                 # 축구/K리그
│  ├─ sports/                 # 공통 경기/팀/리그
│  └─ user/                   # 인증/사용자
└─ docs/                      # 개발 기록, 테스트 체크리스트, 설계 문서
```

## 실행 방법

### 1. 백엔드

요구 사항: Java 17 이상, Oracle DB

```powershell
.\mvnw.cmd spring-boot:run
```

기본 API 주소: `http://localhost:8080/api`

### 2. 프론트엔드

```powershell
cd frontend
npm install
npm run dev
```

기본 화면 주소: `http://localhost:5173`

프론트엔드 API 주소는 `frontend/.env`에서 바꿀 수 있습니다.

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 환경 변수

| 이름 | 설명 |
|---|---|
| `DB_URL` | Oracle DB 접속 URL |
| `DB_USERNAME` | DB 사용자 |
| `DB_PASSWORD` | DB 비밀번호 |
| `GROQ_API_KEY` | Groq AI 분석 API 키 |
| `GROQ_MODEL` | Groq 모델명 |
| `CITO_API_KEY` | LCK Cito API 키 |
| `CITO_API_BASE_URL` | Cito API 기본 URL |
| `GEMINI_API_KEY` | 보조 분석 API 키 |
| `VITE_API_BASE_URL` | 프론트엔드에서 사용할 백엔드 API 주소 |

## 테스트 계정

| 계정 | 비밀번호 | 권한 |
|---|---|---|
| `demo` | `demo123` | 일반 사용자 |
| `admin` | `admin123` | 관리자 |

## 검증 명령

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build

cd ..
.\mvnw.cmd -q -DskipTests compile
```

## 최근 정리 사항

- LCK 오늘 경기 조회를 서울 시간 기준 오늘 날짜 범위로 제한
- TBD 팀이 오늘 경기 카드에 표시되지 않도록 필터링
- 홈 진행 경기 수를 실제 LIVE 상태만 기준으로 표시
- 야구 허브에서 오늘 MLB 경기만 표시하고 혼동되는 LIVE/종료/파워랭킹 문구 정리
- 공통 `TeamLogo` 컴포넌트로 로고 표시 방식 통일
- 프론트 API 경로를 `VITE_API_BASE_URL`로 오버라이드 가능하게 변경
- 앱 최상단 ErrorBoundary 추가로 런타임 오류 화면 대응

## 문서

- [최종 테스트 체크리스트](docs/FINAL_TEST_CHECKLIST.md)
- [프로젝트 정리 기록](docs/PROJECT_STATUS_2026-06-01.md)
- [MLB 설계 문서](docs/MLB_DESIGN_DOCS.md)
- [React REST 전환 계획](docs/REACT_REST_MIGRATION_PLAN.md)
