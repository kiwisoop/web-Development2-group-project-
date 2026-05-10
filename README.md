# web-Development2-group-project- 웹 프로그래밍 2 프로젝트

## Sports Analysis & Summary Website

A web service that provides match lists, match details, stats, event timelines, AI-generated match summaries, and a favorite team feature across multiple sports.

## Purpose
- Build a real-service-like architecture using **React + Spring Boot REST API**.
- Practice splitting work across full-stack feature flows rather than by layer.
- Provide a foundation that can later integrate real data sources (e.g., MLB API) and a real LLM for AI summaries.

## Tech Stack

**Backend**
- Java 17
- Spring Boot 3.5.14
- Spring Web, Spring Data JPA, Validation
- Lombok
- H2 (dev), MySQL Driver (prod-ready)

**Frontend**
- React 19 + Vite
- JavaScript, CSS
- axios (REST), react-router-dom (routing)

## Team Development Rule

We do **not** split work by backend / frontend / database.
Instead, we split by **sport modules**. Each member owns one sport and implements the **entire feature flow**: UI + API connection + data flow + AI summary.

| Member | Sport |
|---|---|
| 1 | SOCCER (reference module) |
| 2 | VOLLEYBALL |
| 3 | BASKETBALL |
| 4 | ESPORTS |

The shared scaffolding (entities, REST APIs, routing, common components, AI generator interface) is built once; each member specializes their sport on top of it.

## Folder Structure

```
sports-analysis/
├─ backend/
│  └─ src/main/java/com/team/sportsanalysis/
│     ├─ common/        # CORS config, SportType enum
│     ├─ user/          # User entity, AuthController
│     ├─ sport/         # SportController
│     ├─ match/         # Match, MatchStat, MatchEvent, Team + controllers
│     ├─ analysis/      # MatchAnalysis, AnalysisGenerator, MockAnalysisGenerator
│     └─ favorite/      # FavoriteTeam + controller
│  └─ src/main/resources/
│     ├─ application.properties
│     └─ data.sql       # sample matches/stats/events for all 4 sports
└─ frontend/
   └─ src/
      ├─ api/           # axios clients (sports, matches, analysis, favorites, auth)
      ├─ components/    # NavBar, MatchCard, StatsTable, EventTimeline, AISummaryCard, SportMatchList
      ├─ pages/         # Home, Login, Register, Soccer/Volleyball/Basketball/Esports, MatchDetail, FavoriteTeams
      ├─ routes/        # AppRouter
      └─ styles/        # app.css
```

## Run

### Backend (port 8080)
```bash
cd backend
./mvnw spring-boot:run
```
Windows PowerShell:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
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
- H2 console: http://localhost:8080/h2-console (JDBC URL: `jdbc:h2:mem:sportsdb`, user `sa`, no password)
- Quick API checks:
  - http://localhost:8080/api/sports
  - http://localhost:8080/api/matches?sportType=SOCCER
  - http://localhost:8080/api/matches/1
  - http://localhost:8080/api/matches/1/stats
  - http://localhost:8080/api/matches/1/events

## Implemented Features

- Home page with sport cards, recent matches, and feature intros
- Sport tabs / pages for Soccer, Volleyball, Basketball, Esports (match list with league, date, teams, score, status, detail button)
- Match detail page (basic info, score, stats table, event timeline, AI summary card, favorite team buttons)
- Mock AI summary generator (`AnalysisGenerator` interface + `MockAnalysisGenerator`) — natural-language summary built from match info, stats, and events; pluggable for a real LLM later
- Favorite team feature (add / list / remove)
- Simple register & login (no Spring Security yet, per spec)
- CORS enabled for the React dev server
- H2 sample data: 3+ matches per sport; full stats and events for the soccer reference module

## API List

| Method | Path | Description |
|---|---|---|
| GET | `/api/sports` | List all sport types |
| GET | `/api/matches?sportType=SOCCER` | List matches by sport (omit param for recent) |
| GET | `/api/matches/{id}` | Match detail |
| GET | `/api/matches/{id}/stats` | Match stats |
| GET | `/api/matches/{id}/events` | Match event timeline |
| GET | `/api/matches/{id}/analysis` | Get saved AI summary |
| POST | `/api/matches/{id}/analysis` | Generate (or regenerate) mock AI summary |
| GET | `/api/favorites/teams?userId=` | List favorite teams |
| POST | `/api/favorites/teams` | Add favorite team |
| DELETE | `/api/favorites/teams/{id}` | Remove favorite team |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |

## Sample Login Account

| Field | Value |
|---|---|
| username | `demo` |
| password | `demo123` |

(Created automatically by `data.sql` on backend start.)

## Future Plan — BASEBALL Module

Add a 5th sport module focused on **baseball**, with richer real-time and analytical features:

- **MLB API integration** — pull live game data, schedules, and team/player info from a real MLB data source instead of seeded sample data
- **Live score** — auto-refreshing scoreboard for in-progress games
- **Fan chat** — per-match real-time chat room (WebSocket) for fans to discuss the game live
- **Strike zone visualization** — render pitch-by-pitch strike zone plots from pitch data
- **Hit-risk analysis** — predict the probability of a hit / extra-base hit per at-bat, using pitch context, batter/pitcher stats, and a lightweight ML model; surface as a probability bar in the match detail page
- Replace `MockAnalysisGenerator` with a real LLM-backed `AnalysisGenerator` for richer summaries

This module will exercise external API integration, real-time features, and data visualization beyond the current four-sport scope.
