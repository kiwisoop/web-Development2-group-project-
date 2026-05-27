# React + REST API Migration Plan

**Project**: Web Sport  
**Date**: 2026-05-17  
**Current Architecture**: Spring Boot + Thymeleaf MVC  
**Target Architecture**: Spring Boot REST API + React + Vite  

---

## 1. Current Structure Summary

### Backend (Java/Spring Boot)
- **Framework**: Spring Boot 3.5.14, Java 17
- **Database**: Oracle DB with JPA/Hibernate
- **Authentication**: HttpSession-based login (no Spring Security)
- **API**: Partial REST API already exists alongside Thymeleaf controllers
- **Configuration**: Environment-based (DB credentials, Gemini API key via env vars)

### Current Packages Structure
```
com.sport.web_sport/
├── user/
│   ├── controller/ (AuthController - Thymeleaf + Form handling)
│   ├── entity/ (User)
│   ├── repository/
│   ├── service/ (AuthService)
│   └── dto/ (LoginRequest, RegisterRequest)
├── sports/
│   ├── controller/ (MatchPageController, MatchApiController, SportPageController, SportApiController)
│   ├── entity/ (Match, Team, League, Player, MatchStat, MatchEvent)
│   ├── repository/ (MatchRepository, TeamRepository, etc.)
│   ├── service/ (MatchService, SportsService)
│   └── dto/ (MatchSearchCondition, response DTOs)
├── analysis/
│   ├── controller/ (AnalysisApiController)
│   ├── entity/ (MatchAnalysis)
│   ├── repository/ (MatchAnalysisRepository)
│   ├── service/ (AnalysisService, GeminiAnalysisGenerator)
│   └── type/ (AnalysisProvider, AnalysisStatus)
├── favorite/
│   ├── controller/ (FavoritePageController, FavoriteApiController)
│   ├── entity/ (FavoriteTeam)
│   ├── repository/ (FavoriteTeamRepository)
│   └── service/ (FavoriteTeamService)
└── common/
    ├── error/ (BusinessException, GlobalExceptionHandler)
    └── type/ (SportType, MatchStatus)
```

### Current Controllers Status
| Controller | Type | Purpose | Status |
|-----------|------|---------|--------|
| AuthController | Traditional | Form-based login/register/logout | **TO CONVERT** |
| HomeController | Traditional | Home page | **TO CONVERT** |
| MatchPageController | Traditional | Match list/detail views | **TO REMOVE** |
| SportPageController | Traditional | Sport list/detail views | **TO REMOVE** |
| FavoritePageController | Traditional | Favorites page | **TO REMOVE** |
| MatchApiController | REST | Match API endpoints | **KEEP & ENHANCE** |
| SportApiController | REST | Sport API endpoints | **KEEP & ENHANCE** |
| AnalysisApiController | REST | Analysis API endpoints | **KEEP & ENHANCE** |
| FavoriteApiController | REST | Favorite API endpoints | **KEEP & ENHANCE** |

### Current Entities
- **User**: username, password, nickname, createdAt
- **Match**: sportType, league, season, matchDate, homeTeam, awayTeam, scores, venue, status
- **Team**: teamName, sport, logoUrl, country
- **League**: leagueName, sport, country, season
- **Player**: playerName, team, position, number, country
- **MatchStat**: match, statName, statValue
- **MatchEvent**: match, eventType, eventTime, description
- **FavoriteTeam**: user, team
- **MatchAnalysis**: match, provider, status, summaryText, tacticalAnalysis, keyPoint, errorMessage

### Current Response DTOs
- MatchResponse, MatchDetailFullResponse, MatchEventResponse, MatchStatResponse
- TeamResponse, LeagueResponse, PlayerResponse
- FavoriteTeamResponse, AnalysisResponse
- PageResponse (pagination wrapper)

### Thymeleaf Templates to Replace
```
src/main/resources/templates/
├── login.html (Auth flow)
├── register.html (Auth flow)
├── index.html (Home/Dashboard)
├── favorites.html (Favorites page)
├── matches/
│   ├── list.html (Search, filter, pagination)
│   └── detail.html (Match detail, analysis, favorite)
├── sports/
│   └── baseball.html (Sport-specific view)
├── api-test.html (Remove or migrate to API docs)
├── error/
│   └── error.html (Generic error page)
└── fragments/ (Reusable components - REMOVE)
    ├── header.html
    ├── nav.html
    ├── footer.html
    ├── layout.html
    ├── teamCards.html
    └── pagination.html
```

---

## 2. Target Architecture

### Frontend (React + Vite)
- **Framework**: React 18+ with Vite
- **Styling**: CSS/CSS-in-JS (maintain current styles or migrate)
- **State Management**: Context API or Redux (evaluate based on complexity)
- **API Client**: Axios or Fetch API
- **Authentication**: Session-based (via HttpOnly cookies)

### New Frontend Structure
```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── LogoutButton.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Nav.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Layout.jsx
│   │   ├── matches/
│   │   │   ├── MatchList.jsx
│   │   │   ├── MatchDetail.jsx
│   │   │   ├── MatchFilter.jsx
│   │   │   └── MatchCard.jsx
│   │   ├── sports/
│   │   │   ├── SportList.jsx
│   │   │   └── SportDetail.jsx
│   │   ├── favorites/
│   │   │   ├── FavoritesList.jsx
│   │   │   ├── FavoriteTeamCard.jsx
│   │   │   └── AddFavoriteButton.jsx
│   │   ├── analysis/
│   │   │   └── AnalysisPanel.jsx
│   │   └── common/
│   │       ├── Pagination.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── ErrorBoundary.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── MatchesPage.jsx
│   │   ├── MatchDetailPage.jsx
│   │   ├── FavoritesPage.jsx
│   │   └── SportsPage.jsx
│   ├── services/
│   │   ├── api.js (Axios instance)
│   │   ├── authService.js
│   │   ├── matchService.js
│   │   ├── sportService.js
│   │   ├── favoriteService.js
│   │   └── analysisService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useMatch.js
│   │   └── useFavorites.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── styles/
│   │   ├── index.css (global styles)
│   │   └── components/ (component-specific styles)
│   ├── utils/
│   │   ├── formatters.js
│   │   └── constants.js
│   └── App.jsx
├── index.html
├── vite.config.js
└── package.json
```

### Backend REST API Endpoints

#### Authentication (New)
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/session (check current user)
```

#### Matches (Existing - Enhance)
```
GET    /api/matches (list with pagination, filtering)
GET    /api/matches/{id} (basic match info)
GET    /api/matches/{id}/detail-full (complete match data)
GET    /api/matches/{id}/stats
GET    /api/matches/{id}/events
```

#### Sports (Existing - Keep)
```
GET    /api/sports (list all sports)
GET    /api/sports/{sportType}/leagues (leagues by sport)
GET    /api/sports/{sportType}/teams (teams by sport)
GET    /api/sports/{sportType}/players (players by sport)
```

#### Analysis (Existing - Keep)
```
POST   /api/analysis/{matchId}/generate (create analysis)
GET    /api/analysis/{matchId} (get analysis)
PUT    /api/analysis/{analysisId} (update analysis - if needed)
```

#### Favorites (Existing - Keep)
```
GET    /api/favorites/teams (user's favorite teams)
POST   /api/favorites/teams (add favorite)
DELETE /api/favorites/teams/{teamId} (remove favorite)
GET    /api/matches/{matchId}/is-favorite-team/{teamId} (check if team is favorite)
```

---

## 3. Migration Breakdown

### 3.1 Files to Keep (No Changes)

#### Entities (Core Data Model)
- `User.java`
- `Match.java`, `Team.java`, `League.java`, `Player.java`
- `MatchStat.java`, `MatchEvent.java`
- `FavoriteTeam.java`
- `MatchAnalysis.java`

#### Repositories (Data Access)
- All `*Repository` interfaces
- No changes needed

#### Services (Business Logic)
- `AuthService.java` (refactor later to support REST)
- `MatchService.java`
- `SportsService.java`
- `FavoriteTeamService.java`
- `AnalysisService.java`
- `GeminiAnalysisGenerator.java`

#### Common/Config
- `BusinessException.java`
- `AnalysisProvider.java`, `AnalysisStatus.java`, `SportType.java`, `MatchStatus.java`
- `DataInitializer.java`
- `GlobalExceptionHandler.java`

#### DTOs (Response Objects)
- All response DTOs in `sports/dto/response/`
- `LoginRequest.java`, `RegisterRequest.java`, `MatchSearchCondition.java`

#### Database & Config
- `application.properties`
- `pom.xml` (add React/Vite dependencies as needed)

#### Maven Wrapper
- `mvnw`, `mvnw.cmd`, `.mvn/` folder

---

### 3.2 Files to Modify

#### AuthController
**Current**: Form-based with Thymeleaf
**Target**: REST controller with JSON requests/responses

```java
// BEFORE: Form-based
@Controller
@PostMapping("/login")
public String login(@ModelAttribute LoginRequest request, HttpSession session)

// AFTER: REST-based
@RestController
@RequestMapping("/api/auth")
@PostMapping("/login")
public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request, HttpSession session)
```

**Changes**:
- Convert to `@RestController`
- Accept JSON request bodies
- Return JSON responses
- Handle CORS for frontend requests
- Set HttpOnly session cookies
- Return user info (id, username, nickname) on successful login

#### AuthService
**Current**: Handles form validation and session
**Target**: Enhanced to support REST + email validation (optional)

**Changes**:
- Add method to get current user from session
- Enhance login response with user details
- Consider adding session validation endpoint

#### GlobalExceptionHandler
**Current**: Basic error handling
**Target**: Enhanced REST error responses

**Changes**:
- Ensure all exceptions return JSON
- Add standardized error response format
- Add 403 handling for unauthorized access

#### pom.xml
**Changes**:
- Add CORS configuration dependencies (if needed)
- No new framework dependencies needed
- Keep Thymeleaf for now (if needed for admin pages)

---

### 3.3 Files to Remove

#### Page Controllers (Thymeleaf-based)
- `MatchPageController.java` → Replace with React
- `SportPageController.java` → Replace with React
- `FavoritePageController.java` → Replace with React
- `HomeController.java` → Replace with React

**Timeline**: Remove AFTER React frontend is deployed and tested

#### Thymeleaf Templates
- `login.html` → React: LoginPage
- `register.html` → React: RegisterPage
- `index.html` → React: HomePage
- `favorites.html` → React: FavoritesPage
- `matches/list.html` → React: MatchesPage
- `matches/detail.html` → React: MatchDetailPage
- `sports/baseball.html` → React: SportsPage
- `api-test.html` → Remove (use Postman/Swagger)
- `error/error.html` → Keep for now (server-side errors)
- All fragments in `fragments/` → Reimplement in React

**Timeline**: Remove AFTER React frontend is deployed and tested

#### Dependencies (Future)
- Remove `spring-boot-starter-thymeleaf` (LATER, after full migration)

---

## 4. Migration Order & Steps

### **Phase 1: Preparation & Backend Enhancement** (No frontend changes yet)

1. **Create Auth REST endpoints**
   - Add `/api/auth/login` (POST)
   - Add `/api/auth/logout` (POST)
   - Add `/api/auth/register` (POST)
   - Add `/api/auth/session` (GET) - check current user
   - Keep AuthController for now (for backward compatibility)

2. **Enhance existing REST controllers**
   - Verify all API endpoints return proper JSON
   - Add missing endpoints if needed
   - Ensure pagination works correctly
   - Test all endpoints with Postman/curl

3. **Configure CORS**
   - Add WebMvcConfigurer bean for CORS
   - Allow localhost:5173 (Vite dev server) and production domain
   - Enable credentials (cookies) in CORS

4. **Add session validation endpoint**
   - `/api/auth/session` returns current user or 401

5. **Create/Update error response format**
   - Standardize all error responses to JSON
   - Include error code, message, timestamp

**Verification**:
- Spring Boot compiles without errors
- All REST endpoints work with JSON requests/responses
- CORS is configured correctly
- Session management works with REST calls

---

### **Phase 2: Frontend Setup & Core Pages** (Vite + React)

1. **Create React project**
   - Use Vite template: `npm create vite@latest frontend -- --template react`
   - Install dependencies: axios, react-router-dom

2. **Set up project structure**
   - Create folders: components/, pages/, services/, hooks/, context/
   - Create API service with axios instance
   - Configure base URL for API calls

3. **Implement auth pages**
   - LoginPage.jsx (form validation)
   - RegisterPage.jsx (form validation)
   - AuthContext for global auth state

4. **Implement layout components**
   - Layout.jsx (header, nav, footer)
   - Nav.jsx (with logout button)
   - Header.jsx

5. **Implement core service layer**
   - authService.js (login, logout, register, getSession)
   - Create hooks: useAuth.js

6. **Create basic route structure**
   - Public routes: /login, /register
   - Protected routes: /, /matches, /favorites

7. **Add protected route component**
   - ProtectedRoute wrapper to check auth status

**Verification**:
- Vite dev server runs: `npm run dev`
- Can navigate between pages
- Can login/logout
- Session persists on page refresh

---

### **Phase 3: Feature Pages** (One feature at a time)

#### **3A: Match Pages**
1. Implement MatchesPage
   - MatchFilter component (sport, date, status, league, team)
   - MatchList component (paginated list)
   - MatchCard component
   - Call GET /api/matches with filters

2. Implement MatchDetailPage
   - Fetch full match data from GET /api/matches/{id}/detail-full
   - Display match info, stats, events
   - AnalysisPanel component (show/regenerate analysis)
   - Favorite team controls

**Testing**: Verify all filters work, pagination, favorite toggle

#### **3B: Favorites Page**
1. Implement FavoritesPage
   - FavoritesList component
   - FavoriteTeamCard component
   - Delete favorite functionality
   - Show matches for favorite teams (optional)

**Testing**: Add/remove favorites, page refreshes correctly

#### **3C: Sports Page** (if needed)
1. Implement SportsPage
   - List leagues by sport
   - List teams by sport
   - Filters and search

**Testing**: Navigation and filters work

#### **3D: Home Page**
1. Implement HomePage
   - Dashboard or match recommendations
   - Featured matches
   - Favorite teams overview

---

### **Phase 4: Styling & Polish**

1. **Migrate CSS**
   - Copy current styles from `src/main/resources/static/css/style.css`
   - Update selectors for React components
   - Or use CSS-in-JS (styled-components, Tailwind)

2. **Responsive design**
   - Test on mobile, tablet, desktop
   - Ensure form inputs work well

3. **Error handling & loading states**
   - Add LoadingSpinner component
   - Add ErrorBoundary component
   - Display user-friendly error messages

4. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Color contrast

---

### **Phase 5: Testing & Validation**

1. **Manual testing**
   - Test all user flows: login → browse → favorite → logout
   - Test pagination, filtering, sorting
   - Test analysis generation
   - Test error scenarios

2. **Browser compatibility**
   - Test on Chrome, Firefox, Safari

3. **Performance**
   - Check bundle size
   - Optimize images
   - Lazy load routes if needed

---

### **Phase 6: Deployment & Cleanup** (Optional - Final Step)

1. **Build React production bundle**
   - `npm run build` → creates `dist/` folder

2. **Integrate frontend with backend**
   - Serve React build from Spring Boot
   - Copy `dist/` contents to `src/main/resources/static/`
   - Create Spring Boot controller to serve index.html

3. **Deploy to production**
   - Build JAR file with embedded React app
   - Deploy to server

4. **Remove Thymeleaf components**
   - Delete page controllers
   - Delete Thymeleaf templates
   - Remove Thymeleaf dependency from pom.xml (optional)

---

## 5. Risk Assessment & Mitigation

### **Risks**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Breaking existing Thymeleaf pages during API changes** | HIGH | Keep both paths during migration. Test API endpoints independently. Maintain backward compatibility until React fully deployed. |
| **Session management issues** | HIGH | Test HttpSession with REST API extensively. Ensure CORS allows credentials. Use HttpOnly cookies. |
| **Data loss during migration** | HIGH | Maintain database schema. Never delete tables. Create backup before making changes. |
| **State sync between frontend/backend** | MEDIUM | Clear React state management, validate data at entry points. Use proper error handling. |
| **CORS blocking requests** | MEDIUM | Configure CORS early, test from different origins. |
| **Pagination breaking** | MEDIUM | Verify PageResponse DTO works with React pagination. Keep pagination logic consistent. |
| **Authentication flow breaking** | HIGH | Test login/logout thoroughly. Ensure cookies are set correctly. |

### **Mitigation Strategy**
1. Create a staging environment to test all changes
2. Keep comprehensive test data
3. Do NOT delete files immediately - mark as deprecated
4. Use feature flags if deploying incrementally
5. Test Thymeleaf pages in parallel with REST API during Phase 1
6. Get user feedback at each phase

---

## 6. Dependency Analysis

### **Backend Dependencies (Keep)**
- Spring Boot 3.5.14
- Spring Data JPA
- Validation (jakarta.validation)
- Lombok
- Oracle JDBC driver

### **New Backend Dependencies (Optional)**
```xml
<!-- If using Spring Web Security in future -->
<!-- (NOT needed for this migration) -->
```

### **Frontend Dependencies (New)**
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x"
}
```

---

## 7. Database Schema Considerations

**No schema changes needed** for Phase 1-5.

**Future considerations** (after React is stable):
- Add API tokens table (if moving to token-based auth)
- Add audit log table (if needed)
- Index optimization for frequently queried fields

---

## 8. Security Considerations

1. **CORS Configuration**
   - Whitelist specific domains
   - Do NOT use `*` for credentials=true

2. **Session Security**
   - Keep HttpOnly flag for session cookies
   - Implement CSRF protection (Spring provides this)
   - Set secure flag for cookies (HTTPS in production)

3. **Input Validation**
   - Validate all REST API inputs
   - Sanitize before saving to DB (already using JPA)

4. **Error Messages**
   - Don't expose internal stack traces in API responses
   - Return generic error messages for security-sensitive operations

---

## 9. Performance Considerations

1. **Frontend Optimization**
   - Lazy load route components
   - Code splitting at route level
   - Cache API responses appropriately

2. **Backend Optimization**
   - N+1 query prevention (use joins in MatchService)
   - Database indexing for frequently queried fields
   - Pagination limits (e.g., max 100 items per page)

3. **Network**
   - Compress JSON responses
   - Minimize API calls where possible
   - Consider GraphQL if many optional fields (future)

---

## 10. Rollback Plan

### **If issues occur during Phase 1-2**:
1. Revert changes to AuthController (keep original)
2. Keep Thymeleaf controllers as fallback
3. Remove new REST endpoints

### **If issues occur during Phase 3-4**:
1. Keep Thymeleaf pages live while React pages are in beta
2. Use URL flags to switch between implementations
3. Gradual rollout to users

### **If issues occur in Phase 6**:
1. Rollback to previous JAR build
2. Keep React build separate (don't integrate)
3. Continue using Thymeleaf + REST API split

---

## 11. Next Steps & Recommendations

### **Immediate Action (This Task)**
✅ Analysis complete - move to Phase 1

### **Next Recommended Implementation Order**

**1. Backend Enhancement Sprint** (1-2 weeks)
   - Implement Auth REST endpoints
   - Enhance error handling
   - Configure CORS
   - Create comprehensive API documentation (Swagger/OpenAPI)
   - Implement Unit Tests for new REST endpoints

**2. Frontend Setup Sprint** (1 week)
   - Create React project
   - Set up routing and project structure
   - Implement login/logout flow
   - Get basic navigation working

**3. Match Features Sprint** (2-3 weeks)
   - Implement match list page with filters
   - Implement match detail page
   - Add analysis panel
   - Test with real data

**4. Additional Features Sprint** (1-2 weeks)
   - Implement favorites page
   - Implement sports/leagues pages
   - Polish UI/UX

**5. Deployment Sprint** (1 week)
   - Build and test production bundles
   - Integrate React with Spring Boot
   - Deploy to staging environment
   - Smoke test production build

---

## 12. Migration Checklist

### **Before Starting (Phase 1)**
- [ ] Back up Oracle database
- [ ] Tag current git commit as "pre-react-migration"
- [ ] Create new git branch for migration work
- [ ] Document current API behavior (create API spec)

### **After Phase 1 Complete**
- [ ] All REST endpoints tested and documented
- [ ] CORS working correctly
- [ ] Session management verified
- [ ] Error handling standardized

### **After Phase 2 Complete**
- [ ] React project running locally
- [ ] Can login/logout
- [ ] Can navigate between pages
- [ ] Auth context working

### **After Phase 3 Complete**
- [ ] All feature pages implemented
- [ ] All API calls working
- [ ] Pagination tested
- [ ] Error scenarios handled

### **After Phase 4 Complete**
- [ ] Styling complete
- [ ] Responsive design verified
- [ ] Accessibility tested
- [ ] Performance optimized

### **Before Phase 6**
- [ ] Full regression testing completed
- [ ] User acceptance testing (UAT)
- [ ] Production build tested
- [ ] Rollback plan documented and tested

---

## 13. Technical Debt & Future Work

### **After React Migration Completes**
1. Remove Thymeleaf dependency
2. Remove page controllers
3. Remove page templates and fragments
4. Consider consolidating Auth + API auth paths

### **Longer Term**
1. Add comprehensive API documentation (Swagger)
2. Add integration tests for backend/frontend interaction
3. Consider upgrading Spring Boot version
4. Consider token-based auth (JWT) instead of sessions
5. Consider GraphQL API if data requirements become complex

---

## Conclusion

This migration plan provides a **safe, incremental path** from Thymeleaf MVC to React + REST API. Key principles:

✅ **Keep existing functionality working** throughout migration  
✅ **Build frontend in parallel** with backend enhancements  
✅ **Test thoroughly** at each phase  
✅ **Maintain backward compatibility** until fully migrated  
✅ **No data loss** - database schema unchanged  

**Estimated Timeline**: 6-10 weeks (depending on team size and complexity)

**Team Recommendations**:
- **Backend Developer**: Phase 1 (REST API enhancement, CORS, error handling)
- **Frontend Developer**: Phase 2-4 (React setup, pages, styling)
- **QA/Tester**: Continuous testing throughout all phases
- **DevOps**: Phase 6 (deployment, integration)

