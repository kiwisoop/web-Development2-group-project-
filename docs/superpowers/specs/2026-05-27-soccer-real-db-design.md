# Soccer (K League) Real-DB Module — Design

## Context

기존 `web-sport` 프로젝트는 SOCCER/BASEBALL/ESPORTS를 하나의 `Match`/`Team`/`League`
엔티티(샘플 데이터, Long ID, `MatchStatus` enum)로 다룬다. Chat·Analysis·Prediction·
Favorite 모듈이 모두 `Match.id (Long)`을 외래키로 참조하므로 기존 SOCCER 데이터 모델을
바꾸면 5개 모듈이 깨진다.

별도로, 실 K리그 데이터(`TEAMS`, `FIXTURES`, `STANDINGS` — VARCHAR ID, `FT`/`NS` status)가
같은 Oracle DB(`soccer/Soccer123!`)에 적재되어 있다.

## Decision

새 모듈 `com.sport.web_sport.soccer/`를 추가해 실 DB를 읽는다. **기존 코드는 건드리지 않는다.**
새 엔드포인트 네임스페이스는 `/api/soccer/*`.

`DataInitializer.seedSoccer()` 호출은 제거 (가짜 K리그 데이터 혼동 방지).
`spring.jpa.hibernate.ddl-auto=update`는 유지하되, 신규 엔티티는 실 스키마와 1:1 매핑.

## Backend

```
soccer/
├── entity/   SoccerTeam, Fixture, Standing
├── repository/ SoccerTeamRepository, FixtureRepository (Specification), StandingRepository
├── dto/  FixtureSearchCondition + response/{FixtureResponse, FixtureDetailResponse,
│       StandingResponse, SoccerTeamResponse}
├── service/ FixtureService, StandingService
└── controller/ SoccerController @RequestMapping("/api/soccer")
```

### Endpoints

| Method | Path                                | Notes                                            |
|-------:|-------------------------------------|--------------------------------------------------|
| GET    | `/api/soccer/fixtures`              | params: season, status (FT/NS), teamId, keyword, page, size, sort |
| GET    | `/api/soccer/fixtures/{id}`         | String fixtureId                                 |
| GET    | `/api/soccer/standings`             | param: season (default 현재 시즌)                |
| GET    | `/api/soccer/teams`                 | 12개                                             |
| GET    | `/api/soccer/teams/{id}`            | 팀 상세                                          |

응답은 모두 `ApiResponse<T>` 또는 `PageResponse<T>`(기존 sports 모듈 재사용).

### Entity 매핑 주의

- `Fixture`: `@ManyToOne(fetch = LAZY)` 으로 home/away `SoccerTeam` 조인, `@EntityGraph`로
  list/detail 조회 시 fetch.
- `Standing.rankPosition` Java 필드 ↔ `@Column(name = "RANK")` (Oracle 함수 충돌 회피).
- `SoccerTeam.teamDesc`는 `@Lob` (CLOB).
- `Standing.standingId`는 읽기 전용이므로 `@Id @Column(name="STANDING_ID")`만, 생성 전략 명시 안 함.

### Status 정규화

Service에서 응답 빌드 시 변환:
- `FT` → `FINAL`
- `NS` → `SCHEDULED`
- 기타 → 그대로

이러면 기존 React `MatchCard`/`StatusBadge` 컴포넌트를 그대로 재사용 가능.

## Frontend

### 새 파일

- `api/soccerApi.js` — getFixtures, getFixture, getStandings, getSoccerTeams
- `pages/SoccerFixturesPage.jsx` — `/soccer/fixtures` (MatchListPage 패턴)
- `pages/SoccerFixtureDetailPage.jsx` — `/soccer/fixtures/:id`
- `pages/SoccerStandingsPage.jsx` — `/soccer/standings` (시즌 토글 2025/2026)

### 수정 파일

- `router/AppRouter.jsx` — 3개 라우트 추가
- `pages/SportsPage.jsx` — `sportType === 'soccer'`일 때 새 API로 데이터 페치하고 "전체 보기 →" 링크를 새 경로로 변경. baseball/esports 분기는 그대로.

### 응답 DTO 형태 (FixtureResponse)

기존 `MatchResponse`와 호환되도록:
```json
{
  "id": "1234567",
  "sportType": "SOCCER",
  "status": "FINAL",
  "season": "2026", "round": "Round 5",
  "matchDate": "2026-04-12T14:00:00",
  "venue": "...", "spectators": "23451", "thumbnailUrl": "...",
  "homeTeam": { "id": "...", "teamName": "...", "shortName": "...", "logoUrl": "..." },
  "awayTeam": { ... },
  "homeScore": 2, "awayScore": 1
}
```

## Out of Scope

- 야구/E스포츠 모듈 변경
- 기존 chat/analysis/prediction/favorite 모듈이 SOCCER 데이터를 사용하도록 연결하는 작업
- Header 메뉴에 K리그 링크 추가 (SportsPage가 진입점)
- 테스트 작성 (기존 코드도 단위 테스트 없음, 일관성 유지)
