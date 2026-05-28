# 축구(K리그) 모듈 가이드

이 문서는 프로젝트의 **축구 파트**에 대해 설명합니다.
TheSportsDB 프리미엄 API → Oracle DB 적재 → Spring Boot REST API → React 페이지까지
전 구간을 다룹니다.

- 작성자: kwr243418
- 마지막 수정: 2026-05-28
- 적용 브랜치: `soccer`

---

## 1. 한눈에 보기

```
[TheSportsDB API]
        │
        ▼
[KLeagueDataCollector.java]  ← Java 수집기 (수동 실행, 프로젝트 루트)
        │
        ▼
[Oracle DB]
  TEAMS (12) / FIXTURES (430) / STANDINGS (24)
        │
        ▼
[Spring Boot — soccer 모듈]
  /api/soccer/fixtures, /api/soccer/standings, /api/soccer/teams …
        │
        ▼
[React 프론트엔드]
  /sports/soccer  (종합 대시보드)
  /soccer/fixtures, /soccer/fixtures/:id, /soccer/standings
```

---

## 2. 사전 준비

### 2-1. Oracle DB

K리그 데이터를 적재할 전용 사용자 `soccer`를 생성해야 합니다.

```sql
-- system 계정으로 접속한 뒤
CREATE USER soccer IDENTIFIED BY "Soccer123!";
GRANT CONNECT, RESOURCE TO soccer;
GRANT UNLIMITED TABLESPACE TO soccer;
```

`Soccer123!`는 예시 비밀번호이며, 운영 환경에서는 다른 값을 사용하세요.
바꿀 경우 `KLeagueDataCollector.java`, `application.properties`의 default 값을 함께
수정하거나 환경변수(`DB_USERNAME`, `DB_PASSWORD`)로 오버라이드하세요.

### 2-2. Java 환경 + 필요 라이브러리 (수동 설치)

`KLeagueDataCollector.java`를 실행하려면 아래 환경·라이브러리가 필요합니다.

**JDK 17 이상** — 백엔드 실행 조건과 동일.

#### 필요 JAR 파일 4개

| 파일 | 용도 |
|---|---|
| `ojdbc11-23.4.0.24.05.jar` | Oracle JDBC 드라이버 |
| `jackson-databind-2.17.0.jar` | JSON 매핑 (`ObjectMapper`, `JsonNode`) |
| `jackson-core-2.17.0.jar` | `jackson-databind` 의존 (저수준 JSON 파서) |
| `jackson-annotations-2.17.0.jar` | `jackson-databind` 의존 (어노테이션 정의) |

#### 다운로드 — 두 가지 방법 중 선택

**방법 A. 커맨드라인 (curl) — 가장 빠름**

프로젝트 루트에서 아래 명령 그대로 실행:

```bash
mkdir -p lib
cd lib
curl -O https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc11/23.4.0.24.05/ojdbc11-23.4.0.24.05.jar
curl -O https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.17.0/jackson-databind-2.17.0.jar
curl -O https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.17.0/jackson-core-2.17.0.jar
curl -O https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.17.0/jackson-annotations-2.17.0.jar
cd ..
```

**방법 B. 브라우저로 다운로드**

위 4개 URL을 브라우저 주소창에 붙여넣으면 곧바로 JAR가 받아집니다 (Maven Central 공식 저장소).
받은 파일을 프로젝트 루트의 `lib/` 폴더에 모두 옮기세요.

#### 폴더 구조 (다운로드 완료 후)

```
web-Development2-group-project-/
├── KLeagueDataCollector.java
├── lib/
│   ├── ojdbc11-23.4.0.24.05.jar
│   ├── jackson-databind-2.17.0.jar
│   ├── jackson-core-2.17.0.jar
│   └── jackson-annotations-2.17.0.jar
├── pom.xml
└── ...
```

#### IntelliJ에 라이브러리 등록

IntelliJ에서 `KLeagueDataCollector.java`의 `import` 빨간 줄을 없애려면:

1. **File → Project Structure** (`⌘ ;` 또는 `Ctrl+Alt+Shift+S`)
2. 좌측 **Modules → Dependencies** 탭
3. 우측 **+** → **JARs or directories…**
4. 방금 만든 `lib/` 폴더 선택 → **OK**
5. **Apply → OK**

#### VS Code에 라이브러리 등록

`Extension Pack for Java` 설치 후:

1. 좌측 사이드바 **JAVA PROJECTS** 패널 열기
2. **Referenced Libraries** 옆 **+** 클릭
3. `lib/` 폴더의 JAR 4개 선택

### 2-3. TheSportsDB API 키

본인 키 발급: <https://www.thesportsdb.com/pricing>
free tier에서는 일부 엔드포인트가 제한되므로 **프리미엄 키**가 필요합니다.

---

## 3. KLeagueDataCollector.java 사용법

K리그 1의 팀·경기·순위 데이터를 TheSportsDB에서 받아 Oracle DB에 저장하는 Java 프로그램입니다.
프로젝트 루트(`pom.xml`과 같은 위치)에 단독 클래스 파일로 존재하며, `package` 선언 없이
`main` 메서드를 가진 standalone 실행 클래스입니다.

### 실행 절차

1. **`KLeagueDataCollector.java` 파일을 열어 상수 3개를 본인 환경에 맞게 수정**합니다.

   ```java
   private static final String API_KEY     = "********";   // ← 자신의 TheSportsDB 프리미엄 키
   private static final String DB_USER     = "soccer";     // ← 본인 DB 계정
   private static final String DB_PASSWORD = "Soccer123!"; // ← 본인 비밀번호
   ```

2. **실행 (IntelliJ / VS Code 등 IDE — 권장)**

   2-2에서 `lib/`를 라이브러리로 등록했다면, IDE에서 `KLeagueDataCollector.java`를 열고
   `main` 메서드 옆의 **Run** 버튼(▶) 클릭.

3. **실행 (커맨드라인)**

   2-2에서 다운로드한 `lib/` 폴더를 classpath로 지정해 컴파일·실행합니다.

   ```bash
   # 컴파일
   javac -cp "lib/*" KLeagueDataCollector.java

   # 실행 (macOS / Linux)
   java -cp ".:lib/*" KLeagueDataCollector

   # 실행 (Windows)
   java -cp ".;lib/*" KLeagueDataCollector

   # 정리 (선택)
   rm KLeagueDataCollector.class
   ```

   ※ `-cp` 구분자가 macOS/Linux는 콜론(`:`), Windows는 세미콜론(`;`)으로 다릅니다.

3. **출력 예시**

   ```
   =============================================
     K리그 데이터 수집 (TheSportsDB 프리미엄)
     2025 ~ 2026 시즌
   =============================================

   테이블 초기화 중...
     → 테이블 준비 완료

   팀 데이터 수집 중...
     → 12개 팀 저장 완료

   ▶ 2025 시즌
   ----------------------------------------
   [2025] 경기 데이터 수집 중...
     → 총 232경기 저장 (종료: 232경기 / 예정: 0경기)
   [2025] 순위 데이터 수집 중...
     → 12개 팀 순위 저장 완료
   ...
   ```

### 적재 결과

| 테이블 | 행 수 | 비고 |
|---|---:|---|
| `TEAMS` | 12 | K리그 1 소속 팀 |
| `FIXTURES` | ~430 | 2025: 232경기(전부 종료) / 2026: 90경기 종료 + 108경기 예정 |
| `STANDINGS` | 24 | 시즌별 12팀 × 2시즌 |

### ⚠️ Git에 올리기 전 반드시

실행 후 **commit/push 하기 전에 `API_KEY`를 다시 `"********"`로 복원**하세요.
실제 API 키가 GitHub에 노출되면 누구나 본인 quota를 소진할 수 있습니다.

```java
private static final String API_KEY = "********"; // 사용하기 전 API 키 변경 후 실행
```

### 재실행 동작

수집기는 매번 실행 시 `DROP TABLE CASCADE CONSTRAINTS` 후 다시 생성합니다.
즉 **기존 데이터를 전부 지우고 새로 적재**합니다. (UPDATE 로직은 안전장치)
시즌 종료·새 라운드 추가 등으로 데이터를 갱신할 때 그냥 다시 돌리면 됩니다.

---

## 4. 백엔드 — Spring Boot

### 4-1. 모듈 구조

```
src/main/java/com/sport/web_sport/soccer/
├── entity/
│   ├── SoccerTeam.java        → @Table("TEAMS")     VARCHAR PK
│   ├── Fixture.java           → @Table("FIXTURES")  VARCHAR PK, ManyToOne home/away
│   └── Standing.java          → @Table("STANDINGS") NUMBER PK
├── repository/
│   ├── SoccerTeamRepository
│   ├── FixtureRepository      (JPQL search + findByIdWithTeams)
│   └── StandingRepository     (findBySeason)
├── dto/
│   ├── FixtureSearchCondition
│   └── response/
│       ├── SoccerTeamResponse
│       ├── FixtureResponse        (FT→FINAL, NS→SCHEDULED 정규화)
│       ├── FixtureDetailResponse  (썸네일·관중 포함)
│       └── StandingResponse
├── service/
│   ├── FixtureService
│   ├── StandingService
│   └── SoccerTeamService
└── controller/
    └── SoccerController       @RequestMapping("/api/soccer")
```

### 4-2. REST API 엔드포인트

| 메서드 | 경로 | 응답 타입 | 설명 |
|---|---|---|---|
| GET | `/api/soccer/fixtures` | `ApiResponse<PageResponse<FixtureResponse>>` | 경기 목록 (검색·페이징) |
| GET | `/api/soccer/fixtures/{id}` | `ApiResponse<FixtureDetailResponse>` | 경기 상세 (썸네일 포함) |
| GET | `/api/soccer/standings` | `ApiResponse<List<StandingResponse>>` | K리그 1 순위표 |
| GET | `/api/soccer/teams` | `ApiResponse<List<SoccerTeamResponse>>` | 12개 팀 요약 |
| GET | `/api/soccer/teams/{id}` | `ApiResponse<SoccerTeamResponse>` | 팀 상세 (구장·창단·소개) |

#### `GET /api/soccer/fixtures` 쿼리 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `season` | String | (전체) | "2025" 또는 "2026" |
| `status` | String | (전체) | "FT"=종료, "NS"=예정 |
| `teamId` | String | (전체) | 홈·원정 어디든 매칭 |
| `keyword` | String | (전체) | 팀명·구장명 부분 검색 |
| `sort` | String | "latest" | "latest"=최신순, "oldest"=오래된순 |
| `page` | int | 0 | 0-indexed |
| `size` | int | 20 | 최대 100 |

#### `GET /api/soccer/standings` 쿼리 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `season` | String | "2026" | 시즌 |

### 4-3. 응답 정규화 규칙

- DB의 `STATUS` 컬럼은 `'FT'` / `'NS'` (TheSportsDB 원본 값)이지만,
  응답 DTO에서는 기존 시스템과 일관성을 위해 **`'FINAL'` / `'SCHEDULED'`** 로 변환되어 나갑니다.
- `HOME_SCORE`, `AWAY_SCORE`는 DB에 `VARCHAR2`로 저장되지만, 응답은 `Integer`로 파싱됩니다.
- `sportType` 필드는 항상 `"SOCCER"` 하드코딩.

### 4-4. 실행

```bash
./mvnw spring-boot:run    # http://localhost:8080
```

---

## 5. 프론트엔드 — React

### 5-1. 추가된 페이지

| URL | 컴포넌트 | 설명 |
|---|---|---|
| `/sports/soccer` | `SoccerOverviewPage` | 축구 종합 대시보드 (예정 6경기 + 최근 결과 6경기 + Top 5 순위) |
| `/soccer/fixtures` | `SoccerFixturesPage` | 시즌·상태·키워드 필터 + 페이징 |
| `/soccer/fixtures/:fixtureId` | `SoccerFixtureDetailPage` | 스코어보드 + 라운드/구장/관중/썸네일 |
| `/soccer/standings` | `SoccerStandingsPage` | 순위표 (2025/2026 시즌 토글) |

추가 단축 경로: `/soccer` → `/soccer/fixtures`로 자동 리다이렉트.

### 5-2. 추가된 API 모듈

```
frontend/src/api/soccerApi.js
  - getFixtures(params, signal)
  - getFixture(fixtureId, signal)
  - getStandings(season, signal)
  - getSoccerTeams(signal)
  - getSoccerTeam(teamId, signal)
```

기존 `axiosInstance`를 그대로 사용하며 `baseURL`은 `http://localhost:8080/api`입니다.

### 5-3. 실행

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

---

## 6. 함께 변경된 기존 파일

축구 모듈을 위해 기존 파일 5개에 **최소 변경**이 들어가 있습니다. 다른 종목(야구·E스포츠)
기능은 영향받지 않습니다.

| 파일 | 변경 내용 | 사유 |
|---|---|---|
| `src/main/resources/application.properties` | DB 기본 계정 `system/0` → `soccer/Soccer123!` + `PreserveQuotedNamingStrategy` 등록 | 실제 K리그 DB 계정 사용 + `RANK` 컬럼 케이스 보존 |
| `src/main/java/.../config/DataInitializer.java` | `seedSoccer()` 호출 1줄 제거 (메서드 자체는 보존) | 진짜 K리그 데이터가 있으므로 가짜 시드 불필요. 야구·E스포츠 시드는 유지 |
| `src/main/java/.../config/PreserveQuotedNamingStrategy.java` | **신규** — Spring 기본 네이밍 전략이 인용된 컬럼명까지 소문자화하던 문제 해결 | Standing 엔티티의 `RANK` 컬럼 매핑용 |
| `frontend/src/components/MatchCard.jsx` | `detailPath` prop 추가 (옵션) | K리그 카드 클릭 시 `/soccer/fixtures/:id`로 이동 |
| `frontend/src/router/AppRouter.jsx` | 라우트 5개 추가 | 위 5-1의 페이지 등록 |
| `frontend/src/styles/components.css` | `.sports-page` 클래스를 `.match-list-page`와 동일 규칙으로 묶음 | 새 페이지 wrapper용 (1줄 추가) |

---

## 7. 트러블슈팅

### `ORA-00904: "S1_0"."rank": invalid identifier`
→ `PreserveQuotedNamingStrategy` 설정이 누락된 경우입니다.
   `application.properties`의 아래 줄 확인:
```properties
spring.jpa.hibernate.naming.physical-strategy=com.sport.web_sport.config.PreserveQuotedNamingStrategy
```

### Hibernate가 FK 제약 추가를 시도하다 실패
→ `Fixture` 엔티티의 `@JoinColumn`에 `foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)`
   가 있는지 확인. 실제 FIXTURES 데이터에 TEAMS에 없는 팀 ID가 일부 포함되어 있어 의도된 처리입니다.

### `KLeagueDataCollector` 실행 시 `ClassNotFoundException: oracle.jdbc.OracleDriver`
→ `lib/` 폴더에 `ojdbc11-*.jar`가 없거나 classpath에 포함되지 않은 경우입니다.
   2-2의 다운로드 단계와 실행 시 `-cp` 인자를 확인하세요.

### `KLeagueDataCollector` 실행 시 `ClassNotFoundException: com.fasterxml.jackson.databind.JsonNode`
→ jackson 관련 JAR 3개(`jackson-databind`, `jackson-core`, `jackson-annotations`) 중 일부가 빠졌습니다.
   `jackson-databind`만으로는 동작하지 않으니 **3개 모두** `lib/`에 있어야 합니다.

### IntelliJ에서 import 빨간 줄이 안 사라짐
→ 2-2 마지막 단계(File → Project Structure → Modules → Dependencies)에서 `lib/` 폴더를
   등록했는지 확인. 등록 후에도 안 풀리면 **File → Invalidate Caches → Invalidate and Restart**.

### 프론트엔드에서 데이터가 안 보이고 콘솔에 CORS 에러
→ 백엔드가 켜져 있고 `application.properties`의 포트가 8080인지 확인.
   `CorsConfig.java`가 `http://localhost:5173`을 허용하고 있어야 합니다.

---

## 8. 향후 개선 아이디어

- [ ] TheSportsDB 외에도 K리그 공식 데이터(KFA) 연동
- [ ] 경기 상세에 라인업·이벤트(골·교체·카드) 표시
- [ ] 팀 상세 페이지 (선수 명단·최근 경기·순위 추이)
- [ ] `KLeagueDataCollector`를 Spring Boot `CommandLineRunner`로 통합하여 스케줄 실행
- [ ] 환경변수·`@Value` 기반 시크릿 관리 (현재는 상수 직접 수정 방식)
