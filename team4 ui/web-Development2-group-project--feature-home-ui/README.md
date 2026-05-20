# Sport Analysis Dashboard / 스포츠 분석·요약 웹사이트

스포츠 경기 정보, AI 분석, 팬 예측 투표, 채팅을 제공하는 분석 대시보드입니다.  
React 프론트엔드가 Spring Boot REST API를 호출하는 구조로 마이그레이션되었습니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | Sport Analysis Dashboard |
| 구조 | React SPA + Spring Boot REST API + Oracle DB |
| 인증 | HttpSession 기반 (Spring Security 미사용) |
| 화면 | 기존 서버 렌더링 화면은 제거되었으며, 화면은 React에서 제공한다. |
| AI | Gemini API (경기 결과 분석 텍스트 생성) |
| 상태 | Thymeleaf 제거 완료, React + Spring Boot REST API 구조로 정리 |

경기 목록·상세 조회, 통계, 이벤트 타임라인, 즐겨찾기, AI 분석, 팬 예측 투표, 랭킹, 경기 채팅, 관리자 대시보드를 제공합니다.

---

## 2. 기술 스택

### Frontend
| 기술 | 역할 |
|---|---|
| React 18 | UI 프레임워크 |
| Vite | 빌드 도구 |
| React Router v7 | 클라이언트 라우팅 |
| Axios | REST API 통신 |

### Backend
| 기술 | 역할 |
|---|---|
| Spring Boot 3 | REST API 서버 |
| Spring Data JPA | ORM |
| Oracle DB | 데이터 저장 |
| Gemini API | AI 분석 텍스트 생성 |
| HttpSession | 인증 세션 관리 |
| Maven | 빌드 도구 |

---

## 3. 주요 기능

| 기능 | 설명 |
|---|---|
| 로그인 / 회원가입 / 로그아웃 | HttpSession 기반 인증 |
| 경기 목록 / 검색 / 필터 / 페이징 | 스포츠 종목·상태·날짜 필터 지원 |
| 경기 상세 | 스코어보드, 통계, 이벤트 타임라인 |
| 즐겨찾기 팀 | 팀 추가·삭제·목록 조회 (로그인 필요) |
| Gemini 경기 분석 | 종료된 경기에 대한 AI 결과 요약 텍스트 생성 |
| 팬 예측 투표 | 경기 전 팬 투표 비율 집계 (AI 확률 아님) |
| 랭킹 | 축구·야구·E스포츠 팀 순위 |
| 경기 채팅 | DB 기반 경기별 채팅방 (LIVE 경기만 작성 가능) |
| 관리자 대시보드 | 전체 통계 집계, 최근 경기·사용자 조회 |
| 관리자 API 테스트 | REST API 직접 호출·응답 확인 (관리자 전용) |
| 에러·접근 제어 페이지 | 404, 로그인 필요, 관리자 전용 안내 페이지 |

---

## 4. 프로젝트 구조

```
web-sport/
├── src/main/java/com/sport/web_sport/
│   ├── admin/          # 관리자 대시보드 API
│   ├── analysis/       # Gemini AI 분석
│   ├── chat/           # 경기 채팅방
│   ├── common/         # 공통 응답·예외·타입
│   ├── favorite/       # 즐겨찾기
│   ├── prediction/     # 팬 예측 투표
│   ├── sports/         # 경기·팀·랭킹
│   └── user/           # 인증·사용자
├── src/main/resources/
│   ├── application.properties
│   └── templates/      # Thymeleaf 템플릿 (제거 예정)
├── frontend/
│   └── src/
│       ├── api/        # Axios API 함수
│       ├── components/ # 공통 컴포넌트
│       ├── pages/      # 페이지 컴포넌트
│       ├── router/     # 라우터·가드
│       ├── hooks/      # useAuth 등
│       └── styles/     # CSS
├── docs/
├── README.md
└── PROMPT_LOG.md
```

---

## 5. 백엔드 실행

**요구사항:** Java 17 이상, Oracle DB

```bash
# 프로젝트 루트에서
.\mvnw.cmd spring-boot:run
```

서버 기본 포트: `http://localhost:8080`

환경 변수 또는 `application.properties`에서 DB·Gemini 설정 필요 (7번 참고).

---

## 6. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

개발 서버: `http://localhost:5173`

프론트엔드는 `http://localhost:8080/api`로 API를 요청합니다.  
백엔드가 먼저 실행 중이어야 합니다.

---

## 7. 환경 변수

`application.properties` 또는 환경 변수로 설정합니다.

| 변수 | 기본값 | 설명 |
|---|---|---|
| `DB_URL` | `jdbc:oracle:thin:@localhost:1521/FREEPDB1` | Oracle 접속 URL |
| `DB_USERNAME` | `system` | DB 사용자명 |
| `DB_PASSWORD` | `0` | DB 비밀번호 |
| `GEMINI_API_KEY` | (없음) | Gemini API 키 |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | 사용 모델명 |

> `GEMINI_API_KEY`가 없으면 AI 분석 생성이 실패하지만 나머지 기능은 정상 작동합니다.

---

## 8. 테스트 계정

| 계정 | 비밀번호 | 역할 |
|---|---|---|
| `demo` | `demo123` | 일반 사용자 |
| `admin` | `admin123` | 관리자 (앱 시작 시 자동 생성) |

> `admin` 계정은 관리자 대시보드(`/admin`)와 API 테스트 페이지(`/admin/api-test`) 접근 가능.

---

## 9. 주요 API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 현재 세션 사용자 정보 |

### 경기
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/matches` | 경기 목록 (필터·페이징) |
| GET | `/api/matches/{id}` | 경기 기본 정보 |
| GET | `/api/matches/{id}/detail-full` | 경기 상세 (통계·이벤트 포함) |

### 즐겨찾기
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/favorites` | 즐겨찾기 목록 |
| POST | `/api/favorites?teamId={teamId}` | 즐겨찾기 추가 |
| DELETE | `/api/favorites/{favoriteId}` | 즐겨찾기 삭제 |

### AI 분석
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/matches/{matchId}/analysis` | 분석 조회 |
| POST | `/api/matches/{matchId}/analysis/generate` | 분석 생성 |
| POST | `/api/matches/{matchId}/analysis/regenerate` | 분석 재생성 |

### 팬 예측 투표
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/matches/{matchId}/prediction` | 투표 결과 조회 |
| POST | `/api/matches/{matchId}/prediction/vote` | 투표 |

### 랭킹
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/rankings/{sportType}` | 팀 순위 (SOCCER·BASEBALL·ESPORTS) |

### 채팅
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/matches/{matchId}/chat` | 채팅 메시지 조회 (모든 상태) |
| POST | `/api/matches/{matchId}/chat` | 메시지 전송 (LIVE 경기만 허용) |

### 관리자
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/admin/dashboard` | 관리자 통계 대시보드 (ADMIN 필요) |

---

## 10. 주요 설계 결정

| 항목 | 결정 사항 |
|---|---|
| UI/API 분리 | React가 UI를 담당, Spring Boot는 JSON REST API만 제공 |
| 인증 | Spring Security 미사용, HttpSession으로 직접 구현 |
| 응답 형식 | 모든 API는 `ApiResponse<T>` 래퍼 반환, 엔티티 직접 노출 없음 |
| Gemini 분석 | 종료된 경기의 결과를 요약 설명, 승률 예측 아님 |
| 팬 투표 | 사용자 투표 비율 집계, AI 확률과 무관 |
| 경기 채팅 | DB 저장, 경기별 독립 채팅방, LIVE 상태일 때만 작성 허용 |
| 관리자 접근 | `User.role = ADMIN` 세션 검증, 비관리자는 403 반환 |

---

## 11. 개발 과정

1. 기존 Spring Boot + Thymeleaf 프로젝트 분석
2. React + REST API 마이그레이션 계획 수립
3. 백엔드 REST API 준비 (DTO 응답, 세션 인증)
4. React 프론트엔드 추가 및 API 연동
5. 기능별 페이즈로 분리하여 순차 구현
6. 프롬프트 로그는 `PROMPT_LOG.md`에 관리

---

## 12. 향후 개선 사항

- [ ] Thymeleaf 템플릿 완전 제거
- [ ] MLB API 연동 (야구 실제 데이터)
- [ ] 경기 전 AI 승리 확률 예측 기능
- [ ] 종목별 세부 데이터 확장
- [ ] WebSocket 실시간 채팅
- [ ] 관리자 CRUD 기능 (경기·팀·사용자 관리)

---

## 13. 팀 역할 구성 예시

| 역할 | 담당 업무 |
|---|---|
| 백엔드 / REST API | Spring Boot API 설계·구현, 인증, 채팅, 분석 |
| 프론트엔드 / React UI | 페이지·컴포넌트 구현, 라우팅, 상태 관리 |
| 스포츠 데이터 연동 | 경기·팀·랭킹 데이터 수집 및 DB 적재 |
| DB / 문서화 | Oracle 스키마 관리, README, PROMPT_LOG 작성 |
