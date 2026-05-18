# Phase 1: Backend REST API Preparation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the Spring Boot backend to serve a React + Vite frontend via REST APIs, without removing or breaking any existing Thymeleaf pages.

**Architecture:** Add a dedicated `RestAuthController` at `/api/auth/**` alongside the existing Thymeleaf `AuthController`. Introduce a shared `ApiResponse<T>` wrapper for consistent JSON responses. Configure CORS for `http://localhost:5173` on all `/api/**` routes, and update `GlobalExceptionHandler` to return `ApiResponse`-formatted JSON for API errors.

**Tech Stack:** Spring Boot 3.5.14, Java 17, Lombok, Jakarta Validation, HttpSession, Oracle DB via JPA

---

## Existing Code Context

Before touching any file, internalize these facts:

- **`AuthService`** (`user/service/AuthService.java`) — already has `register()`, `login()`, `logout()`, `getLoginUserId()`. These will be called directly from the new controller. `SESSION_USER_ID` and `SESSION_USERNAME` are the session attribute constants.
- **`LoginRequest`** (`user/dto/LoginRequest.java`) — fields: `username`, `password`, both `@NotBlank`
- **`RegisterRequest`** (`user/dto/RegisterRequest.java`) — fields: `username`, `password`, `nickname`, all `@NotBlank`
- **`UserRepository`** — `JpaRepository<User, Long>` with `findByUsername()` and `existsByUsername()`
- **`User` entity** — fields: `id (Long)`, `username`, `password`, `nickname`, `createdAt`. No `role` field — default to string `"USER"` in DTOs.
- **`GlobalExceptionHandler`** — already detects `/api/**` URIs via `isApi()` and returns JSON, but uses `Map.of("error", message)` format. This will be replaced with `ApiResponse.error(message)`.
- **`DataInitializer`** is in package `com.sport.web_sport.config` — new `CorsConfig` goes in that same package.
- **Thymeleaf `AuthController`** — must NOT be modified. It handles `GET /login`, `POST /login`, `GET /register`, `POST /register`, `GET /logout`.

---

## File Map

| Action | File |
|--------|------|
| **Create** | `src/main/java/com/sport/web_sport/common/response/ApiResponse.java` |
| **Create** | `src/main/java/com/sport/web_sport/user/dto/UserResponse.java` |
| **Create** | `src/main/java/com/sport/web_sport/user/dto/MeResponse.java` |
| **Create** | `src/main/java/com/sport/web_sport/config/CorsConfig.java` |
| **Create** | `src/main/java/com/sport/web_sport/user/controller/RestAuthController.java` |
| **Modify** | `src/main/java/com/sport/web_sport/common/error/GlobalExceptionHandler.java` |

---

## Task 1: Create `ApiResponse<T>` Wrapper

**Files:**
- Create: `src/main/java/com/sport/web_sport/common/response/ApiResponse.java`

- [ ] **Step 1: Create the file**

```java
package com.sport.web_sport.common.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
```

- [ ] **Step 2: Verify the file compiles in isolation**

Run: `.\mvnw.cmd compile -pl . -q`

Expected output: BUILD SUCCESS (or at minimum no errors referencing `ApiResponse`)

---

## Task 2: Create `UserResponse` DTO

**Files:**
- Create: `src/main/java/com/sport/web_sport/user/dto/UserResponse.java`

This DTO is returned after login and register success. It exposes safe user info (never the password).

- [ ] **Step 1: Create the file**

```java
package com.sport.web_sport.user.dto;

import com.sport.web_sport.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String nickname;
    private String role;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .role("USER")
                .build();
    }
}
```

---

## Task 3: Create `MeResponse` DTO

**Files:**
- Create: `src/main/java/com/sport/web_sport/user/dto/MeResponse.java`

This DTO is returned by `GET /api/auth/me`. It always succeeds — when not logged in it returns `loggedIn: false` with null fields.

- [ ] **Step 1: Create the file**

```java
package com.sport.web_sport.user.dto;

import com.sport.web_sport.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MeResponse {
    private boolean loggedIn;
    private Long userId;
    private String username;
    private String nickname;
    private String role;

    public static MeResponse of(User user) {
        return MeResponse.builder()
                .loggedIn(true)
                .userId(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .role("USER")
                .build();
    }

    public static MeResponse anonymous() {
        return MeResponse.builder()
                .loggedIn(false)
                .build();
    }
}
```

---

## Task 4: Create CORS Configuration

**Files:**
- Create: `src/main/java/com/sport/web_sport/config/CorsConfig.java`

Allows the Vite dev server (`http://localhost:5173`) to make credentialed requests to `/api/**`.

- [ ] **Step 1: Create the file**

```java
package com.sport.web_sport.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

---

## Task 5: Update `GlobalExceptionHandler` to Use `ApiResponse`

**Files:**
- Modify: `src/main/java/com/sport/web_sport/common/error/GlobalExceptionHandler.java`

The current `jsonError` helper returns `Map<String, Object>` with key `"error"`. Replace it to return `ApiResponse.error(message)`. The public method signatures and `@ExceptionHandler` annotations stay the same — only the private helper and return type changes.

- [ ] **Step 1: Replace the file content**

Replace the entire file with:

```java
package com.sport.web_sport.common.error;

import com.sport.web_sport.common.response.ApiResponse;
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

    private static ResponseEntity<ApiResponse<Void>> jsonError(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(message));
    }

    private static boolean isApi(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri != null && uri.startsWith("/api/");
    }
}
```

---

## Task 6: Create `RestAuthController`

**Files:**
- Create: `src/main/java/com/sport/web_sport/user/controller/RestAuthController.java`

This is a new `@RestController` at `/api/auth`. It coexists with the existing Thymeleaf `AuthController` — there is no conflict because the paths are different.

- [ ] **Step 1: Create the file**

```java
package com.sport.web_sport.user.controller;

import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.user.dto.LoginRequest;
import com.sport.web_sport.user.dto.MeResponse;
import com.sport.web_sport.user.dto.RegisterRequest;
import com.sport.web_sport.user.dto.UserResponse;
import com.sport.web_sport.user.entity.User;
import com.sport.web_sport.user.repository.UserRepository;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RestAuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("회원가입이 완료되었습니다.", UserResponse.from(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpSession session) {
        User user = authService.login(request, session);
        return ResponseEntity.ok(ApiResponse.ok("로그인이 완료되었습니다.", UserResponse.from(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpSession session) {
        authService.logout(session);
        return ResponseEntity.ok(ApiResponse.ok("로그아웃이 완료되었습니다.", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> me(HttpSession session) {
        Long userId = authService.getLoginUserId(session);
        if (userId == null) {
            return ResponseEntity.ok(ApiResponse.ok(MeResponse.anonymous()));
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            session.invalidate();
            return ResponseEntity.ok(ApiResponse.ok(MeResponse.anonymous()));
        }
        return ResponseEntity.ok(ApiResponse.ok(MeResponse.of(user)));
    }
}
```

---

## Task 7: Compile Verification

- [ ] **Step 1: Run compile**

```
.\mvnw.cmd compile
```

Expected output:
```
[INFO] BUILD SUCCESS
```

If `BUILD SUCCESS` is not shown, read the first `ERROR` line and fix it before continuing.

- [ ] **Step 2: Confirm no regressions to Thymeleaf controllers**

The following files must NOT have been modified:
- `AuthController.java`
- `HomeController.java`
- `MatchPageController.java`
- `SportPageController.java`
- `FavoritePageController.java`

Verify by checking that git shows no changes to those files (or confirming you never edited them).

---

## Task 8: Commit

- [ ] **Step 1: Stage new and modified files**

```
git add src/main/java/com/sport/web_sport/common/response/ApiResponse.java
git add src/main/java/com/sport/web_sport/user/dto/UserResponse.java
git add src/main/java/com/sport/web_sport/user/dto/MeResponse.java
git add src/main/java/com/sport/web_sport/config/CorsConfig.java
git add src/main/java/com/sport/web_sport/user/controller/RestAuthController.java
git add src/main/java/com/sport/web_sport/common/error/GlobalExceptionHandler.java
git add docs/superpowers/plans/2026-05-17-phase1-backend-rest-prep.md
```

- [ ] **Step 2: Commit**

```
git commit -m "feat: add REST auth API, CORS config, and ApiResponse wrapper for React migration Phase 1"
```

---

## Summary of Changes

### Files Created
| File | Purpose |
|------|---------|
| `common/response/ApiResponse.java` | Generic `{ success, message, data }` response wrapper |
| `user/dto/UserResponse.java` | Safe user DTO (no password); returned on login/register |
| `user/dto/MeResponse.java` | Session state DTO; returned by `GET /api/auth/me` |
| `config/CorsConfig.java` | CORS for `/api/**` → `http://localhost:5173` with credentials |
| `user/controller/RestAuthController.java` | REST endpoints at `/api/auth/{register,login,logout,me}` |

### Files Modified
| File | Change |
|------|--------|
| `common/error/GlobalExceptionHandler.java` | `jsonError()` now returns `ApiResponse<Void>` instead of `Map<String, Object>` |

### New REST Endpoints
| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| POST | `/api/auth/register` | No | Register and get UserResponse |
| POST | `/api/auth/login` | No | Login, set session cookie, get UserResponse |
| POST | `/api/auth/logout` | No | Invalidate session |
| GET  | `/api/auth/me` | No (never 401) | Returns loggedIn status + user info if authenticated |

### Thymeleaf Behavior Preserved
- `GET /login` → `login.html` ✅ (AuthController untouched)
- `POST /login` → form submit → redirect ✅ (AuthController untouched)
- `GET /register` → `register.html` ✅ (AuthController untouched)
- `POST /register` → form submit → redirect ✅ (AuthController untouched)
- `GET /logout` → redirect ✅ (AuthController untouched)
- All other page controllers untouched ✅

### Next Recommended Step
**Phase 2: Frontend Setup** — scaffold `frontend/` using `npm create vite@latest frontend -- --template react`, install `axios` and `react-router-dom`, configure the Vite proxy to forward `/api/**` to `http://localhost:8080`, implement `AuthContext`, and implement `LoginPage` / `RegisterPage` calling `POST /api/auth/login` and `POST /api/auth/register`.
