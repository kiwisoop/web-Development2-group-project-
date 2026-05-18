# Common Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply common project-wide cleanup — Thymeleaf layout fragments, validation polish, exception handler that distinguishes API vs page, env-driven properties, README, and remove leftover txt files.

**Architecture:** Introduce 4 Thymeleaf fragments (`header`, `nav`, `footer`, `layout`) and refactor every page template to use them. Improve `AuthController` + DTOs so Bean Validation errors render under form fields. Split `GlobalExceptionHandler` into an API branch (`@RestControllerAdvice` returns JSON) and a page branch (`@ControllerAdvice` returns `error/error.html`), handling validation, enum-binding, missing-param, and login-required cases. Move secrets/connection strings to environment variables in `application.properties`.

**Tech Stack:** Spring Boot 3.5.14, Java 17, Thymeleaf, JPA, Oracle, Lombok. No React, no Spring Security.

**Conventions observed:**
- Login state is held in `HttpSession` under `AuthService.SESSION_USER_ID` / `SESSION_USERNAME`. Thymeleaf can access via `${session.LOGIN_USER_ID}` / `${session.LOGIN_USERNAME}` — so the nav fragment doesn't require every controller to push login attributes.
- Existing inline nav is only in `index.html` (lines 9–24); other pages have no nav at all.
- Error template at `templates/error/error.html` exists and consumes `${error}`.
- `BusinessException("로그인이 필요합니다.")` is the convention used by services for login-required (e.g. `AuthService.requireLoginUserId`). The exception handler will detect this message to distinguish 401-ish flow.

---

## File Structure

**Create:**
- `src/main/resources/templates/fragments/header.html`
- `src/main/resources/templates/fragments/nav.html`
- `src/main/resources/templates/fragments/footer.html`
- `src/main/resources/templates/fragments/layout.html`
- `README.md`

**Modify (templates — apply fragments):**
- `templates/index.html`
- `templates/login.html`
- `templates/register.html`
- `templates/matches/list.html`
- `templates/matches/detail.html`
- `templates/sports/soccer.html`
- `templates/sports/baseball.html`
- `templates/sports/esports.html`
- `templates/favorites.html`
- `templates/error/error.html`

**Modify (validation + error handling):**
- `src/main/java/com/sport/web_sport/user/dto/RegisterRequest.java`
- `src/main/java/com/sport/web_sport/user/controller/AuthController.java`
- `src/main/java/com/sport/web_sport/common/error/GlobalExceptionHandler.java`
- `src/main/resources/application.properties`

**Delete:**
- `4.txt`
- `aaaa.txt`
- `3번째.txt` is already staged for deletion — will be committed alongside.

---

## Task 1: Create Thymeleaf fragments

**Files:**
- Create: `src/main/resources/templates/fragments/header.html`
- Create: `src/main/resources/templates/fragments/nav.html`
- Create: `src/main/resources/templates/fragments/footer.html`
- Create: `src/main/resources/templates/fragments/layout.html`

- [ ] **Step 1: `fragments/header.html`** — head block with stylesheet, parameterized title

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head th:fragment="head(title)">
    <meta charset="UTF-8">
    <title th:text="${title} ?: 'Sport Analysis'">Sport Analysis</title>
    <link rel="stylesheet" th:href="@{/css/style.css}">
</head>
<body></body>
</html>
```

- [ ] **Step 2: `fragments/nav.html`** — top nav, reads login state from session

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<body>
<nav th:fragment="nav" class="nav">
    <a th:href="@{/}">Home</a>
    <a th:href="@{/sports/soccer}">Soccer</a>
    <a th:href="@{/sports/baseball}">Baseball</a>
    <a th:href="@{/sports/esports}">Esports</a>
    <a th:href="@{/matches}">Matches</a>
    <a th:href="@{/favorites}">Favorites</a>
    <span th:if="${session.LOGIN_USERNAME}">
        <span th:text="${session.LOGIN_USERNAME}">user</span>
        <a th:href="@{/logout}">Logout</a>
    </span>
    <span th:unless="${session.LOGIN_USERNAME}">
        <a th:href="@{/login}">Login</a>
        <a th:href="@{/register}">Register</a>
    </span>
</nav>
</body>
</html>
```

- [ ] **Step 3: `fragments/footer.html`**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<body>
<footer th:fragment="footer" class="footer">
    <hr>
    <p>&copy; Sport Analysis - Team Project</p>
</footer>
</body>
</html>
```

- [ ] **Step 4: `fragments/layout.html`** — full-page wrapper using `th:replace` with content slot via `th:fragment`

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" th:fragment="page(title, content)">
<head th:replace="~{fragments/header :: head(${title})}"></head>
<body>
<nav th:replace="~{fragments/nav :: nav}"></nav>
<main>
    <th:block th:replace="${content}"></th:block>
</main>
<footer th:replace="~{fragments/footer :: footer}"></footer>
</body>
</html>
```

- [ ] **Step 5: Compile (no Java touched, but verify Thymeleaf cache is off and no syntax error)**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 6: Commit**

```bash
git add src/main/resources/templates/fragments/header.html \
        src/main/resources/templates/fragments/nav.html \
        src/main/resources/templates/fragments/footer.html \
        src/main/resources/templates/fragments/layout.html
git commit -m "feat(template): add header/nav/footer/layout fragments"
```

---

## Task 2: Apply fragments to all page templates

Each page gets the same shell: `head` replace, `nav` replace at top of body, original `<main>` content kept inside, `footer` replace at end. Existing logic (forms, tables, JS) is preserved verbatim.

**Files:**
- Modify: `templates/index.html`
- Modify: `templates/login.html`
- Modify: `templates/register.html`
- Modify: `templates/matches/list.html`
- Modify: `templates/matches/detail.html`
- Modify: `templates/sports/soccer.html`
- Modify: `templates/sports/baseball.html`
- Modify: `templates/sports/esports.html`
- Modify: `templates/favorites.html`
- Modify: `templates/error/error.html`

- [ ] **Step 1: Pattern to apply to each file**

Replace the existing `<head>` block with:
```html
<head th:replace="~{fragments/header :: head('<PAGE TITLE>')}"></head>
```

Right after `<body>`, insert:
```html
<nav th:replace="~{fragments/nav :: nav}"></nav>
```

Right before `</body>`, insert:
```html
<footer th:replace="~{fragments/footer :: footer}"></footer>
```

The inline `<nav>` block currently in `index.html` (lines 9–24) is removed since it's replaced by the fragment.

- [ ] **Step 2: Per-page title strings**

| File | Title |
|---|---|
| index.html | `Sport Analysis` |
| login.html | `로그인` |
| register.html | `회원가입` |
| matches/list.html | `경기 목록` |
| matches/detail.html | `경기 상세` |
| sports/soccer.html | `Soccer` |
| sports/baseball.html | `Baseball` |
| sports/esports.html | `Esports` |
| favorites.html | `즐겨찾기` |
| error/error.html | `오류` |

- [ ] **Step 3: Worked example — `templates/index.html`**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{fragments/header :: head('Sport Analysis')}"></head>
<body>
<nav th:replace="~{fragments/nav :: nav}"></nav>
<main>
    <h1>스포츠 분석</h1>
    <h2>최근 경기</h2>
    <ul>
        <li th:each="m : ${recentMatches}">
            <a th:href="@{|/matches/${m.id}|}">
                <span th:text="${m.sportType}">SPORT</span>
                |
                <span th:text="${m.homeTeam?.teamName}">Home</span>
                <span th:text="${m.homeScore} ?: '-'">-</span>
                :
                <span th:text="${m.awayScore} ?: '-'">-</span>
                <span th:text="${m.awayTeam?.teamName}">Away</span>
                (<span th:text="${m.status}">STATUS</span>)
            </a>
        </li>
    </ul>
</main>
<footer th:replace="~{fragments/footer :: footer}"></footer>
</body>
</html>
```

- [ ] **Step 4: Worked example — `templates/login.html`** (includes validation block scaffolding for Task 3)

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{fragments/header :: head('로그인')}"></head>
<body>
<nav th:replace="~{fragments/nav :: nav}"></nav>
<main>
    <h1>로그인</h1>
    <p th:if="${error}" th:text="${error}" class="error"></p>
    <form th:action="@{/login}" th:object="${loginRequest}" method="post">
        <label>아이디 <input type="text" th:field="*{username}"></label>
        <p th:if="${#fields.hasErrors('username')}" th:errors="*{username}" class="error"></p>
        <label>비밀번호 <input type="password" th:field="*{password}"></label>
        <p th:if="${#fields.hasErrors('password')}" th:errors="*{password}" class="error"></p>
        <button type="submit">로그인</button>
    </form>
    <p><a th:href="@{/register}">회원가입</a></p>
</main>
<footer th:replace="~{fragments/footer :: footer}"></footer>
</body>
</html>
```

- [ ] **Step 5: Worked example — `templates/register.html`** (analogous + nickname field)

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{fragments/header :: head('회원가입')}"></head>
<body>
<nav th:replace="~{fragments/nav :: nav}"></nav>
<main>
    <h1>회원가입</h1>
    <p th:if="${error}" th:text="${error}" class="error"></p>
    <form th:action="@{/register}" th:object="${registerRequest}" method="post">
        <label>아이디 <input type="text" th:field="*{username}"></label>
        <p th:if="${#fields.hasErrors('username')}" th:errors="*{username}" class="error"></p>
        <label>비밀번호 <input type="password" th:field="*{password}"></label>
        <p th:if="${#fields.hasErrors('password')}" th:errors="*{password}" class="error"></p>
        <label>닉네임 <input type="text" th:field="*{nickname}"></label>
        <p th:if="${#fields.hasErrors('nickname')}" th:errors="*{nickname}" class="error"></p>
        <button type="submit">가입</button>
    </form>
</main>
<footer th:replace="~{fragments/footer :: footer}"></footer>
</body>
</html>
```

- [ ] **Step 6: For the remaining templates** (`matches/list.html`, `matches/detail.html`, `sports/*.html`, `favorites.html`, `error/error.html`)

Apply only the head/nav/footer shell from Step 1 + Step 2 title. Keep all `<main>` content (including the inline `<script>` in `matches/detail.html`) byte-for-byte identical.

- [ ] **Step 7: Build**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 8: Commit**

```bash
git add src/main/resources/templates/
git commit -m "feat(template): apply header/nav/footer fragments to all pages"
```

---

## Task 3: Validation improvements (RegisterRequest + AuthController)

**Files:**
- Modify: `src/main/java/com/sport/web_sport/user/dto/RegisterRequest.java`
- Modify: `src/main/java/com/sport/web_sport/user/controller/AuthController.java`

- [ ] **Step 1: `RegisterRequest.java`** — add `@NotBlank` to `nickname`

```java
package com.sport.web_sport.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
    @NotBlank
    private String nickname;
}
```

- [ ] **Step 2: `LoginRequest.java`** — read it first to confirm fields. If `username` / `password` lack `@NotBlank`, add them.

Run: `grep -n "NotBlank\|private String" src/main/java/com/sport/web_sport/user/dto/LoginRequest.java`

If `@NotBlank` is missing, update to:
```java
package com.sport.web_sport.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
}
```

- [ ] **Step 3: `AuthController.java`** — accept `BindingResult` and short-circuit to the form view when invalid

Replace `login(...)` and `register(...)` methods with:

```java
@PostMapping("/login")
public String login(@Valid @ModelAttribute LoginRequest loginRequest,
                    BindingResult bindingResult,
                    HttpSession session,
                    Model model) {
    if (bindingResult.hasErrors()) {
        return "login";
    }
    try {
        authService.login(loginRequest, session);
        return "redirect:/";
    } catch (RuntimeException e) {
        model.addAttribute("error", e.getMessage());
        return "login";
    }
}

@PostMapping("/register")
public String register(@Valid @ModelAttribute RegisterRequest registerRequest,
                       BindingResult bindingResult,
                       Model model) {
    if (bindingResult.hasErrors()) {
        return "register";
    }
    try {
        authService.register(registerRequest);
        return "redirect:/login";
    } catch (RuntimeException e) {
        model.addAttribute("error", e.getMessage());
        return "register";
    }
}
```

Add the import: `import org.springframework.validation.BindingResult;`

- [ ] **Step 4: Build**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/sport/web_sport/user/dto/RegisterRequest.java \
        src/main/java/com/sport/web_sport/user/dto/LoginRequest.java \
        src/main/java/com/sport/web_sport/user/controller/AuthController.java
git commit -m "feat(auth): add @NotBlank constraints and BindingResult handling"
```

---

## Task 4: Split GlobalExceptionHandler — API JSON vs page HTML

**Files:**
- Modify: `src/main/java/com/sport/web_sport/common/error/GlobalExceptionHandler.java`

The new handler must:
1. Detect API vs page by request path prefix (`/api/`) — page requests render `error/error.html`, API requests return `{"error":"..."}` JSON.
2. Handle `MethodArgumentNotValidException` (validation failure on `@RequestBody` / `@Valid @ModelAttribute` for non-form scenarios) → 400 with first error message.
3. Handle `MethodArgumentTypeMismatchException` (bad enum / wrong type query param) → 400 with "잘못된 파라미터: ${name}".
4. Handle `MissingServletRequestParameterException` → 400 with "필수 파라미터 누락: ${name}".
5. Login-required → if `BusinessException.getMessage().equals("로그인이 필요합니다.")`, return 401 for API and `redirect:/login` for pages.
6. Other `BusinessException` → 400 with message.
7. Fallback `Exception` → 500.

- [ ] **Step 1: Replace `GlobalExceptionHandler.java`**

```java
package com.sport.web_sport.common.error;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final String LOGIN_REQUIRED_MESSAGE = "로그인이 필요합니다.";

    @ExceptionHandler(BusinessException.class)
    public Object handleBusiness(BusinessException e, HttpServletRequest request, Model model) {
        if (LOGIN_REQUIRED_MESSAGE.equals(e.getMessage())) {
            return isApi(request)
                    ? jsonError(HttpStatus.UNAUTHORIZED, e.getMessage())
                    : "redirect:/login";
        }
        return errorResponse(request, model, HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Object handleValidation(MethodArgumentNotValidException e,
                                   HttpServletRequest request,
                                   Model model) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("유효성 검증에 실패했습니다.");
        return errorResponse(request, model, HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public Object handleTypeMismatch(MethodArgumentTypeMismatchException e,
                                     HttpServletRequest request,
                                     Model model) {
        return errorResponse(request, model, HttpStatus.BAD_REQUEST,
                "잘못된 파라미터: " + e.getName());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public Object handleMissingParam(MissingServletRequestParameterException e,
                                     HttpServletRequest request,
                                     Model model) {
        return errorResponse(request, model, HttpStatus.BAD_REQUEST,
                "필수 파라미터 누락: " + e.getParameterName());
    }

    @ExceptionHandler(Exception.class)
    public Object handleAll(Exception e, HttpServletRequest request, Model model) {
        String msg = e.getMessage() == null ? "Internal error" : e.getMessage();
        return errorResponse(request, model, HttpStatus.INTERNAL_SERVER_ERROR, msg);
    }

    private Object errorResponse(HttpServletRequest request, Model model,
                                 HttpStatus status, String message) {
        if (isApi(request)) {
            return jsonError(status, message);
        }
        model.addAttribute("error", message);
        model.addAttribute("status", status.value());
        return "error/error";
    }

    private static ResponseEntity<Map<String, Object>> jsonError(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }

    private static boolean isApi(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri != null && uri.startsWith("/api/");
    }
}
```

- [ ] **Step 2: Build**

Run: `./mvnw compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/sport/web_sport/common/error/GlobalExceptionHandler.java
git commit -m "feat(error): split API/page error handling; handle validation, type-mismatch, missing-param, login-required"
```

---

## Task 5: Update `application.properties` to env-driven config

**Files:**
- Modify: `src/main/resources/application.properties`

- [ ] **Step 1: Replace the file contents**

```properties
spring.application.name=web-sport

# === Oracle DB (override via env: DB_URL, DB_USERNAME, DB_PASSWORD) ===
spring.datasource.url=${DB_URL:jdbc:oracle:thin:@localhost:1521/FREEPDB1}
spring.datasource.username=${DB_USERNAME:system}
spring.datasource.password=${DB_PASSWORD:0}
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver

# === JPA ===
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.database-platform=org.hibernate.dialect.OracleDialect
spring.jpa.open-in-view=false

# === Thymeleaf ===
spring.thymeleaf.cache=false

# === Server ===
server.port=8080
server.servlet.session.timeout=30m

# === Gemini (override via env: GEMINI_API_KEY, GEMINI_MODEL) ===
gemini.api.key=${GEMINI_API_KEY:}
gemini.model=${GEMINI_MODEL:gemini-2.5-flash-lite}
```

Note: `ddl-auto` changes from `create-drop` to `update` — sample data inserted by `DataInitializer` will now persist across restarts. This matches the spec's "Do not remove sample data" rule (data initializer runs on first boot, schema is preserved thereafter).

- [ ] **Step 2: Build**

Run: `./mvnw compile -q`

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/application.properties
git commit -m "config: env-driven DB/Gemini settings; ddl-auto=update"
```

---

## Task 6: Create `README.md`

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

```markdown
# Sport Analysis Web (web-sport)

스포츠 경기 정보와 Gemini AI 분석을 제공하는 팀 프로젝트.

## Tech Stack

- Spring Boot 3.5.14
- Java 17
- Thymeleaf (server-side rendering)
- Spring Data JPA + Hibernate
- Oracle Database (free/XE/22c)
- Lombok
- Google Gemini API (실 호출)
- Maven (with wrapper `mvnw`)

## Features

- 회원가입 / 로그인 / 로그아웃 (HttpSession 기반)
- 종목별(축구/야구/이스포츠) 리그·팀 페이지
- 경기 목록 검색·필터 (종목/리그/팀/날짜/년월/상태/키워드)
- 경기 상세 페이지 (스탯·이벤트·즐겨찾기·AI 분석)
- 팀 즐겨찾기 추가/삭제
- Gemini AI 경기 분석 (DB 캐싱, NOT_CREATED 시 자동 생성, 재생성 버튼)

## Run

### Prerequisites

- Java 17+
- 실행 중인 Oracle 인스턴스 (기본 `jdbc:oracle:thin:@localhost:1521/FREEPDB1`)
- Gemini API key (선택 — 없으면 분석 호출 시 `FAILED` 상태로 저장)

### Environment variables

| Name | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:oracle:thin:@localhost:1521/FREEPDB1` | Oracle JDBC URL |
| `DB_USERNAME` | `system` | DB user |
| `DB_PASSWORD` | `0` | DB password |
| `GEMINI_API_KEY` | (empty) | Google AI Studio API key |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Gemini model id |

### Start

```bash
# Windows PowerShell
$env:GEMINI_API_KEY="YOUR_KEY"
./mvnw spring-boot:run

# bash
export GEMINI_API_KEY=YOUR_KEY
./mvnw spring-boot:run
```

브라우저에서 `http://localhost:8080` 접속.

## Oracle setup

1. Oracle Free/XE 또는 동등한 인스턴스를 `1521` 포트로 실행.
2. `FREEPDB1` (또는 환경에 맞는) PDB 사용. 다른 SID/PDB라면 `DB_URL` 환경변수로 덮어쓰기.
3. 최초 부팅 시 `spring.jpa.hibernate.ddl-auto=update`로 스키마 자동 생성, 샘플 데이터는 `DataInitializer`에 의해 한 번 적재됨.

## Gemini setup

1. https://aistudio.google.com 에서 API 키 발급.
2. `GEMINI_API_KEY` 환경변수에 설정. 코드/설정파일에 하드코딩 금지.
3. 모델은 기본 `gemini-2.5-flash-lite`, 변경 시 `GEMINI_MODEL` 환경변수 사용.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/matches` | 경기 목록 (검색 필터 쿼리 파라미터 지원) |
| GET | `/api/matches/{id}` | 경기 기본 정보 |
| GET | `/api/matches/{id}/stats` | 경기 스탯 |
| GET | `/api/matches/{id}/events` | 경기 이벤트 |
| GET | `/api/matches/{id}/detail-full` | 경기 종합 정보 (분석 호출 안 함) |
| GET | `/api/matches/{matchId}/analysis?provider=GEMINI` | 저장된 분석 조회 (없으면 NOT_CREATED) |
| POST | `/api/matches/{matchId}/analysis/generate` | 분석 생성 (DONE 있으면 재사용) |
| POST | `/api/matches/{matchId}/analysis/regenerate` | 분석 강제 재생성 |
| GET | `/api/sports` | 종목 enum 목록 |
| GET | `/api/leagues?sportType=` | 리그 목록 |
| GET | `/api/teams?sportType=&leagueId=` | 팀 목록 |
| GET | `/api/players?teamId=` | 선수 목록 |
| GET | `/api/favorites` | 즐겨찾기 목록 (로그인 필요) |
| POST | `/api/favorites?teamId=` | 즐겨찾기 추가 |
| DELETE | `/api/favorites/{favoriteId}` | 즐겨찾기 삭제 |

응답은 JPA 엔티티가 아닌 `sports/dto/response`의 DTO를 사용.

## Team workflow

- `main` 브랜치에 직접 푸시 (현 단계 — 추후 PR 기반으로 전환 가능)
- 커밋 메시지: `feat(scope):` / `fix(scope):` / `refactor(scope):` / `config:` / `docs:` 등 conventional commit 사용
- 새 기능 추가 시 plan을 `docs/superpowers/plans/` 아래에 두고 구현
- 응답 객체는 항상 DTO. 엔티티를 REST 응답으로 직접 반환 금지.
- Gemini는 POST에서만 호출. GET은 DB 캐시 읽기 전용.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with run guide, env vars, API list"
```

---

## Task 7: Remove leftover txt files

**Files:**
- Delete: `4.txt`, `aaaa.txt` (and the already-deleted `3번째.txt` gets committed)

- [ ] **Step 1: Delete the files**

```bash
git rm -f -- 4.txt aaaa.txt "3번째.txt" 2>/dev/null || true
# `3번째.txt` is already missing on disk; `git rm` records the deletion.
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove leftover scratch files (3번째.txt, 4.txt, aaaa.txt)"
```

Leave `bb.txt`, `c.txt`, and `docs/` untouched.

- [ ] **Step 3: Final full build**

Run: `./mvnw clean compile -q`
Expected: BUILD SUCCESS.

---

## Self-Review Checklist

- Spec §1 fragments — Task 1 creates all four under `templates/fragments/`.
- Spec §2 apply fragments to all 10 templates — Task 2 lists each file with title and the same shell.
- Spec §3 @NotBlank on nickname + BindingResult + show messages — Task 3 covers DTO + AuthController; Task 2 worked-examples for login/register include `#fields.hasErrors` blocks.
- Spec §4 GlobalExceptionHandler — Task 4 handles API JSON vs page HTML, validation, type mismatch (invalid enum), missing param, login required.
- Spec §5 env vars + ddl-auto=update — Task 5.
- Spec §6 README — Task 6 covers purpose, stack, features, run, Oracle, Gemini, API, team workflow.
- Spec §7 remove txt files — Task 7 removes `3번째.txt`, `4.txt`, `aaaa.txt`. Confirmed with user that `bb.txt` and `c.txt` stay.
- Don't-do: no React, no Spring Security, no removed features (favorite/match search/Gemini all preserved), no heavy CSS modifications.
