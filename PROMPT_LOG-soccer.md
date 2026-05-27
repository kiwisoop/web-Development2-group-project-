# Claude Code Prompt Log — 축구(K리그) 파트

이 문서는 Sport Analysis Dashboard 프로젝트의 **축구(K리그) 모듈 개발 단계**에서
사용된 프롬프트의 목적, 요약, 기대 결과, 실제 결과, 채택 여부, 후속 조치를 기록합니다.
기존 `PROMPT_LOG.md`(프로젝트 전체 마이그레이션 기록)와 동일한 양식을 따르며,
축구 파트 담당자(kwr243418)의 개인 작업 로그입니다.

- 적용 브랜치: `soccer`
- 작업 기간: 2026-05-26 ~ 2026-05-28
- 관련 문서: `README-soccer.md`, `docs/superpowers/specs/2026-05-27-soccer-real-db-design.md`

---

## 1. 축구 종합 페이지 초안 (Sports Page Soccer Draft)

- **목적:**
  비어 있던 `SportsPage.jsx` placeholder를 축구 종합 대시보드로 채워, 사용자가
  `/sports/soccer`에서 예정 경기·최근 결과·랭킹을 한 화면에서 확인할 수 있도록 함

- **프롬프트 요약:**
  기존 `MatchCard`, `RankingTable`, `LoadingState`, `EmptyState` 컴포넌트를 재사용하고
  3섹션 세로 스택(예정·결과·랭킹)으로 구성. 기존 `/api/matches`와 `/api/rankings`
  엔드포인트를 그대로 활용

- **기대 결과:**
  새 백엔드 작업 없이 프론트엔드만으로 축구 대시보드 동작

- **실제 결과:**
  `SportsPage.jsx` 구현, `.sports-page` 클래스 1줄 추가, 기존 API 응답 형식과 호환

- **채택 여부:** 채택 (이후 6번 작업에서 K리그 실데이터 API로 교체됨)

- **후속 조치:**
  실제 K리그 DB(TheSportsDB 기반) 도입 결정에 따라 백엔드 모듈 신설 진행

---

## 2. K리그 데이터 수집 스크립트 (TheSportsDB Data Ingestion)

- **목적:**
  TheSportsDB 프리미엄 API로부터 K리그 1의 팀·경기·순위 데이터를 받아
  Oracle DB에 적재하는 Python 스크립트 작성

- **프롬프트 요약:**
  `requests` + `oracledb` 사용, `TEAMS / FIXTURES / STANDINGS` 3개 테이블의
  DDL을 스크립트 안에서 직접 생성·갱신. 2025·2026 두 시즌을 일괄 수집

- **기대 결과:**
  단일 명령(`python collect_kleague.py`)으로 K리그 전체 데이터 적재

- **실제 결과:**
  `collect_kleague.py` 작성. TEAMS 12개, FIXTURES 430개(2025: 232 / 2026: 198),
  STANDINGS 24개 적재 성공

- **채택 여부:** 채택

- **후속 조치:**
  API 키가 평문으로 노출되지 않도록 commit 전 `"********"` 마스킹 (8번 작업)

---

## 3. K리그 백엔드 모듈 — Entity·Repository·DTO·Service·Controller

- **목적:**
  Oracle DB의 실 K리그 테이블을 Spring Boot가 직접 조회할 수 있도록
  `com.sport.web_sport.soccer` 패키지 신설

- **프롬프트 요약:**
  기존 시스템(Match/Team 등 Long ID + MatchStatus enum)과 충돌하지 않도록
  완전 분리된 네임스페이스 `/api/soccer/*`로 작성. VARCHAR String ID,
  `'FT'/'NS'` 원본 status를 응답 시 `'FINAL'/'SCHEDULED'`로 정규화.
  `ApiResponse<T>`, `PageResponse<T>` 기존 패턴 재사용

- **기대 결과:**
  채팅·예측·즐겨찾기·AI 분석 등 기존 5개 모듈에 영향 없이 K리그 데이터 노출

- **실제 결과:**
  entity 3개(`SoccerTeam`, `Fixture`, `Standing`),
  repository 3개, dto 5개, service 3개, controller 1개 작성.
  `mvn compile` 성공, 98개 source file로 증가

- **채택 여부:** 채택

- **후속 조치:**
  실제 DB 연결 검증, `RANK` 컬럼 ORA-00904 트러블슈팅 (4번)

---

## 4. Oracle RANK 컬럼 케이스 보존 (PreserveQuotedNamingStrategy)

- **목적:**
  Spring Boot의 기본 `CamelCaseToUnderscoresNamingStrategy`가 백틱·따옴표로
  명시한 인용 식별자까지 소문자화하여 발생한 `ORA-00904: "S1_0"."rank": invalid identifier`
  오류 해결

- **프롬프트 요약:**
  `CamelCaseToUnderscoresNamingStrategy`를 상속받아 `Identifier.isQuoted()`인 경우에만
  원본을 보존하는 커스텀 네이밍 전략 작성. `application.properties`의
  `spring.jpa.hibernate.naming.physical-strategy`에 등록

- **기대 결과:**
  `Standing.rankPosition` (`@Column(name = "\`RANK\`")`)이 Oracle의 `RANK` 컬럼과
  올바르게 매핑됨

- **실제 결과:**
  `PreserveQuotedNamingStrategy.java` 신규 작성. `GET /api/soccer/standings?season=2026`
  호출 시 12팀 전체 순위(FC Seoul 1위, 32점 등) 정상 응답

- **채택 여부:** 채택

- **후속 조치:**
  기존 다른 엔티티(snake_case 변환에 의존)는 영향 없음 — 인용된 이름만 우회

---

## 5. FIXTURES → TEAMS FK 제약 비활성화

- **목적:**
  Hibernate가 매 기동마다 `Fixture.@ManyToOne SoccerTeam` 관계에 대해
  FK 제약을 추가하다 ORA-02298 (parent keys not found)로 실패하는 경고 제거.
  실 FIXTURES 데이터에 TEAMS에 없는 일부 team_id가 포함되어 있음

- **프롬프트 요약:**
  `Fixture` 엔티티의 home/away `@JoinColumn`에
  `foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)` 추가

- **기대 결과:**
  Hibernate가 FK 추가를 시도하지 않으면서도 JPA 레벨에서는 `@ManyToOne`이 정상 작동

- **실제 결과:**
  앱 기동 시 ORA-02298 경고 사라짐. 기동 시간 3.0초 → 2.6초로 단축

- **채택 여부:** 채택

- **후속 조치:**
  데이터 정합성은 수집 스크립트 단계에서 책임지는 것으로 정리

---

## 6. K리그 프론트엔드 페이지 4종 (Soccer Pages)

- **목적:**
  새 백엔드 엔드포인트(`/api/soccer/*`)를 사용하는 전용 페이지를 추가하여
  실 K리그 데이터를 검색·열람할 수 있게 함

- **프롬프트 요약:**
  `SoccerFixturesPage` (필터·페이징, 기존 `MatchListPage` 패턴),
  `SoccerFixtureDetailPage` (Scoreboard 재사용 + 라운드/관중/썸네일),
  `SoccerStandingsPage` (시즌 토글 2025/2026, `RankingTable` 재사용),
  `SoccerOverviewPage` (Top 5 미니뷰).
  `MatchCard`에 `detailPath` prop을 추가하여 `/soccer/fixtures/:id`로 라우팅

- **기대 결과:**
  `/soccer/fixtures`, `/soccer/fixtures/:fixtureId`, `/soccer/standings`,
  `/sports/soccer` 4개 경로에서 K리그 실데이터 조회 가능

- **실제 결과:**
  `soccerApi.js` + 4개 페이지 신규 작성, `AppRouter`에 라우트 5개 추가,
  `MatchCard` 옵션 prop 추가. `npm run build` 성공(125 modules)

- **채택 여부:** 채택

- **후속 조치:**
  `SportsPage`가 baseball/esports까지 일반화된 점이 팀원 작업 영역을 침범한다는
  피드백을 받아 7번 작업에서 재분리

---

## 7. SportsPage 범위 축소 (Limit to Soccer Only)

- **목적:**
  처음 작성한 `SportsPage`가 `useParams`로 baseball/esports까지 자동 렌더링하여
  팀원들이 담당할 종목의 화면을 미리 점유하는 문제 해결

- **프롬프트 요약:**
  축구 전용 로직을 `SoccerOverviewPage.jsx`로 분리, `SportsPage.jsx`는 원본
  placeholder(`<h1>Sports page ready</h1>`)로 복원. `AppRouter`에서
  `/sports/soccer`를 새 컴포넌트로 명시 라우팅하고, 그 외 `/sports/:sportType`은
  기존 placeholder 유지

- **기대 결과:**
  `/sports/soccer`만 본인이 만든 대시보드를 보여주고, `/sports/baseball`,
  `/sports/esports`는 원래대로 빈 placeholder

- **실제 결과:**
  `SoccerOverviewPage.jsx` 신설, `SportsPage.jsx` 원본 복원. `npm run build` 성공
  (125 modules 유지). 야구·E스포츠 담당 팀원의 작업 영역 원복

- **채택 여부:** 채택

- **후속 조치:**
  팀원과의 영역 구분이 명확해진 상태에서 push 진행

---

## 8. API 키 보안 처리 (Mask API Key in collect_kleague.py)

- **목적:**
  `collect_kleague.py`의 TheSportsDB API 키가 GitHub에 평문으로 노출되지 않도록 처리

- **프롬프트 요약:**
  처음에는 `.env` + `python-dotenv` + `.gitignore` 표준 패턴을 제안했으나,
  설치·재설정이 번거롭다는 피드백을 받아 단순 마스킹으로 전환.
  `API_KEY = "********"`와 함께 "사용 전 본인 키로 교체, commit 전 복원" 안내 주석 추가

- **기대 결과:**
  키 노출 없이 스크립트 자체는 GitHub에 공개 가능

- **실제 결과:**
  `collect_kleague.py` 한 줄(`API_KEY = "********"`)로 처리. 함께 만들었던
  `.env`, `.env.example`, `.gitignore` 추가분은 사용자 요청에 따라 정리·롤백

- **채택 여부:** 채택 (단순 마스킹 방식)

- **후속 조치:**
  사용자가 매번 실행 시 키를 직접 교체·복원하는 운용. 자동화 필요해지면 `.env`
  방식으로 재전환 가능

---

## 9. 축구 모듈 가이드 문서화 (README-soccer.md)

- **목적:**
  팀원·교수자가 축구 파트의 전체 구성(데이터 수집부터 화면까지)을 한 문서로
  파악할 수 있도록 가이드 작성

- **프롬프트 요약:**
  사전 준비(Oracle DB 계정, Python 환경), `collect_kleague.py` 사용법,
  백엔드 모듈 구조 및 REST API 5개, 프론트엔드 페이지 4개, 함께 변경된 기존 파일
  6개, 트러블슈팅, 향후 개선 아이디어 8개 섹션 구성

- **기대 결과:**
  팀원이 본 문서만으로 축구 파트를 로컬에서 실행하고 동작을 이해 가능

- **실제 결과:**
  `README-soccer.md` 작성 완료

- **채택 여부:** 채택

- **후속 조치:**
  본 프롬프트 로그(`PROMPT_LOG-soccer.md`) 작성, 이후 최종 push

---

## 프롬프트 활용 전략 정리

| 전략 | 내용 |
|---|---|
| 충돌 사전 식별 | 새 모듈 작성 전 기존 `/api/matches`, `MatchService`, chat·analysis·prediction·favorite 5개 모듈과의 의존 관계 먼저 분석 |
| 격리된 네임스페이스 | 기존 코드 변경을 최소화하기 위해 완전히 분리된 `/api/soccer/*` 경로와 `soccer` 패키지 채택 |
| 단계별 검증 | 백엔드 컴파일 → 실행 → curl로 엔드포인트 확인 → 프론트 빌드 → 브라우저 시뮬레이션 순서 유지 |
| 트러블슈팅 기록 | ORA-00904, ORA-02298 등 실 DB 연동에서만 드러난 이슈를 즉시 entity/설정에 반영 |
| 팀원 영역 존중 | baseball·esports는 placeholder를 의도적으로 유지하여 다른 팀원의 작업 공간 보호 |

**매 프롬프트에 명시한 제약 조건:**
- 기존 `Match`, `Team`, `MatchSearchCondition`, `RankingService` 등 변경 금지
- `ApiResponse<T>` 응답 래퍼 사용
- HttpSession 인증 방식 유지 (Spring Security 사용 금지)
- DB 스키마 변경 최소화 (실 K리그 테이블은 외부 스크립트가 책임)
- 환경별 분기를 위해 `application.properties` 기본값은 환경변수로 override 가능하게 유지

**AI 활용에 대한 설명:**
이 축구 모듈에서도 Claude Code는 코드를 대신 작성해 주는 도구가 아닌 개발 보조 도구로
활용되었습니다. 실제 DB 연결 후 발생한 ORA 에러의 재현·원인 분석·수정 검증은 모두
실 환경에서 수동으로 확인하였고, 팀원의 영역 침범 같은 협업 관련 판단 역시 사람이
직접 결정·롤백한 결과입니다. 최종 책임은 작업자에게 있습니다.
