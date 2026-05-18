# Phase 2: React + Vite Frontend Scaffold

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a React + Vite frontend in `frontend/` with routing, auth hook, shared components, styled pages, and a working production build — without touching any existing Thymeleaf backend files.

**Architecture:** Vite serves the React SPA at `localhost:5173` while Spring Boot runs at `localhost:8080`. Axios calls `/api/**` directly (CORS already configured in Phase 1). Auth state is managed via an `AuthProvider` + `useAuth` hook defined in a single file, consumed throughout the app via React Context.

**Tech Stack:** React 18, Vite, react-router-dom 6, axios, plain CSS (no Tailwind, no UI libraries), JavaScript (not TypeScript)

---

## Existing Context

- Backend: Spring Boot 3.5.14 at `http://localhost:8080`
- CORS: `/api/**` allows `http://localhost:5173` with `allowCredentials: true` (done in Phase 1)
- REST auth APIs available:
  - `POST /api/auth/register` → `{ success, message, data: { id, username, nickname, role } }`
  - `POST /api/auth/login` → `{ success, message, data: { id, username, nickname, role } }`
  - `POST /api/auth/logout` → `{ success, message, data: null }`
  - `GET /api/auth/me` → `{ success, message, data: { loggedIn, userId, username, nickname, role } }` — **never returns 401, always 200**
- Working directory: `E:\web3\web-sport-react-rebuild`
- Do NOT commit. Do NOT touch backend files.

---

## File Map

| Action | File |
|--------|------|
| Create (via npm) | `frontend/` — entire Vite scaffold |
| Modify | `frontend/vite.config.js` — add `server.port: 5173` |
| Modify | `frontend/src/main.jsx` — import our CSS, remove index.css import |
| Modify | `frontend/src/App.jsx` — render AppRouter only |
| Delete content | `frontend/src/App.css` — clear (not deleted, just emptied) |
| Create | `frontend/src/api/axiosInstance.js` |
| Create | `frontend/src/api/authApi.js` |
| Create | `frontend/src/hooks/useAuth.js` |
| Create | `frontend/src/styles/global.css` |
| Create | `frontend/src/styles/layout.css` |
| Create | `frontend/src/styles/components.css` |
| Create | `frontend/src/components/Header.jsx` |
| Create | `frontend/src/components/Layout.jsx` |
| Create | `frontend/src/components/LoadingState.jsx` |
| Create | `frontend/src/components/EmptyState.jsx` |
| Create | `frontend/src/components/ErrorBox.jsx` |
| Create | `frontend/src/router/AppRouter.jsx` |
| Create | `frontend/src/pages/HomePage.jsx` |
| Create | `frontend/src/pages/LoginPage.jsx` |
| Create | `frontend/src/pages/RegisterPage.jsx` |
| Create | `frontend/src/pages/MatchListPage.jsx` |
| Create | `frontend/src/pages/MatchDetailPage.jsx` |
| Create | `frontend/src/pages/FavoritesPage.jsx` |
| Create | `frontend/src/pages/SportsPage.jsx` |
| Create | `frontend/src/pages/AdminDashboardPage.jsx` |
| Create | `frontend/src/pages/ErrorPage.jsx` |

---

## Task 1: Scaffold Vite Project and Install Dependencies

**Working directory for all commands: `E:\web3\web-sport-react-rebuild`**

- [ ] **Step 1: Scaffold the React + Vite project**

Run in PowerShell from `E:\web3\web-sport-react-rebuild`:
```powershell
npm create vite@latest frontend -- --template react
```

Expected output contains: `Done. Now run:` and `cd frontend`

If the command asks interactive questions (project name, framework), the `--template react` flag should skip them. If it still asks, answer: project name = `frontend`, framework = `React`, variant = `JavaScript`.

- [ ] **Step 2: Install base dependencies**

```powershell
cd frontend; npm install
```

Expected: resolves packages and prints `added N packages`

- [ ] **Step 3: Install additional dependencies**

```powershell
npm install react-router-dom axios
```

Expected: `added N packages`

- [ ] **Step 4: Verify the scaffold builds**

```powershell
npm run build
```

Expected: `dist/` folder created, `✓ built in Xs`

---

## Task 2: Create API Layer

**Working directory: `E:\web3\web-sport-react-rebuild\frontend`**

**Files:**
- Create: `src/api/axiosInstance.js`
- Create: `src/api/authApi.js`

- [ ] **Step 1: Create `src/api/axiosInstance.js`**

```js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
});

export default axiosInstance;
```

- [ ] **Step 2: Create `src/api/authApi.js`**

```js
import axiosInstance from './axiosInstance';

export const register = (data) => axiosInstance.post('/auth/register', data);
export const login = (data) => axiosInstance.post('/auth/login', data);
export const logout = () => axiosInstance.post('/auth/logout');
export const getMe = () => axiosInstance.get('/auth/me');
```

---

## Task 3: Create `useAuth.js` Hook with Context

**File:**
- Create: `frontend/src/hooks/useAuth.js`

This file exports both `AuthProvider` (wraps the app) and `useAuth()` (consumes context). `GET /api/auth/me` always returns 200 — a `loggedIn: false` response is NOT an error.

- [ ] **Step 1: Create `src/hooks/useAuth.js`**

```js
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login, logout, register, getMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMe();
      setUser(res.data.data);
    } catch {
      setUser({ loggedIn: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loginUser = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await login(data);
      setUser(res.data.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || '로그인에 실패했습니다.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await register(data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
    } finally {
      setUser({ loggedIn: false });
      setLoading(false);
    }
  };

  const isLoggedIn = user?.loggedIn === true;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{ user, loading, error, checkAuth, loginUser, registerUser, logoutUser, isLoggedIn, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

---

## Task 4: Create CSS Files

**Files:**
- Create: `frontend/src/styles/global.css`
- Create: `frontend/src/styles/layout.css`
- Create: `frontend/src/styles/components.css`

- [ ] **Step 1: Create `src/styles/global.css`**

```css
:root {
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-accent: #7c3aed;
  --color-bg: #f0f4f8;
  --color-surface: #ffffff;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-error: #dc2626;
  --color-error-bg: #fef2f2;
  --radius: 0.75rem;
  --shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  min-height: 100vh;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 2: Create `src/styles/layout.css`**

```css
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.brand {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
}

.brand:hover {
  text-decoration: none;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.nav a {
  color: var(--color-text-muted);
  font-weight: 500;
  transition: color 0.15s;
}

.nav a:hover {
  color: var(--color-primary);
  text-decoration: none;
}

.auth-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.username {
  font-weight: 600;
  color: var(--color-text);
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.page-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

@media (max-width: 768px) {
  .header-inner {
    flex-wrap: wrap;
    height: auto;
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }

  .nav {
    order: 3;
    width: 100%;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .main-content {
    padding: 1rem;
  }
}
```

- [ ] **Step 3: Create `src/styles/components.css`**

```css
/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
}

.btn:hover { text-decoration: none; }

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-outline:hover {
  background: var(--color-primary);
  color: #fff;
}

.btn-full { width: 100%; }

.btn-lg {
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Cards */
.card {
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
}

/* Forms */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-group input {
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 1rem;
  color: var(--color-text);
  transition: border-color 0.15s;
  outline: none;
  background: var(--color-surface);
}

.form-group input:focus {
  border-color: var(--color-primary);
}

/* Auth card */
.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.auth-link {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* Error box */
.error-box {
  background: var(--color-error-bg);
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  color: var(--color-error);
  font-size: 0.875rem;
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--color-text-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Hero */
.hero {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: var(--radius);
  padding: 4rem 2rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #fff;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.hero-desc {
  font-size: 1.125rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.hero .btn-primary {
  background: #fff;
  color: var(--color-primary);
  border-color: #fff;
}

.hero .btn-primary:hover { background: rgba(255, 255, 255, 0.9); }

.hero .btn-outline {
  border-color: rgba(255, 255, 255, 0.7);
  color: #fff;
}

.hero .btn-outline:hover { background: rgba(255, 255, 255, 0.15); }

/* Sports section */
.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.sport-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.sport-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  transition: transform 0.15s, box-shadow 0.15s;
  color: var(--color-text);
}

.sport-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  text-decoration: none;
}

.sport-emoji { font-size: 2rem; }

.sport-card h3 {
  font-size: 1.125rem;
  font-weight: 700;
}

.sport-card p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* Placeholder page */
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
}

.placeholder-page h1 {
  font-size: 1.5rem;
  color: var(--color-text-muted);
}

/* 404 error page */
.error-page-card {
  text-align: center;
  padding: 3rem;
  max-width: 400px;
}

.error-page-card h1 {
  font-size: 5rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.error-page-card p {
  margin-bottom: 2rem;
  color: var(--color-text-muted);
}
```

---

## Task 5: Create Shared Components

**Files:**
- Create: `frontend/src/components/Header.jsx`
- Create: `frontend/src/components/Layout.jsx`
- Create: `frontend/src/components/LoadingState.jsx`
- Create: `frontend/src/components/EmptyState.jsx`
- Create: `frontend/src/components/ErrorBox.jsx`

- [ ] **Step 1: Create `src/components/ErrorBox.jsx`**

```jsx
export default function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="error-box">
      <p>{message}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/LoadingState.jsx`**

```jsx
export default function LoadingState({ message = '불러오는 중...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/EmptyState.jsx`**

```jsx
export default function EmptyState({ title = '데이터가 없습니다', description = '' }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc">{description}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/Header.jsx`**

```jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, isLoggedIn, isAdmin, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">Sport Analysis Dashboard</Link>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/matches">Matches</Link>
          <Link to="/sports/soccer">Sports</Link>
          <Link to="/favorites">Favorites</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
        </nav>
        <div className="auth-section">
          {isLoggedIn ? (
            <>
              <span className="username">{user?.nickname || user?.username}</span>
              <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create `src/components/Layout.jsx`**

```jsx
import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="app-wrapper">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## Task 6: Create Auth Pages

**Files:**
- Create: `frontend/src/pages/LoginPage.jsx`
- Create: `frontend/src/pages/RegisterPage.jsx`

- [ ] **Step 1: Create `src/pages/LoginPage.jsx`**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ErrorBox from '../components/ErrorBox';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const { loginUser, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(form);
      navigate('/');
    } catch {
      // error already set in useAuth
    }
  };

  return (
    <div className="page-center">
      <div className="card auth-card">
        <h1 className="auth-title">로그인</h1>
        <ErrorBox message={error} />
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="auth-link">
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/pages/RegisterPage.jsx`**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ErrorBox from '../components/ErrorBox';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', nickname: '', password: '' });
  const { registerUser, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(form);
      navigate('/login');
    } catch {
      // error already set in useAuth
    }
  };

  return (
    <div className="page-center">
      <div className="card auth-card">
        <h1 className="auth-title">회원가입</h1>
        <ErrorBox message={error} />
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              value={form.nickname}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>
        <p className="auth-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
```

---

## Task 7: Create HomePage

**File:**
- Create: `frontend/src/pages/HomePage.jsx`

- [ ] **Step 1: Create `src/pages/HomePage.jsx`**

```jsx
import { Link } from 'react-router-dom';

const sports = [
  { id: 'soccer', name: '축구', emoji: '⚽', desc: '전 세계 축구 경기 일정과 결과를 확인하세요.' },
  { id: 'baseball', name: '야구', emoji: '⚾', desc: '국내외 야구 경기 분석을 제공합니다.' },
  { id: 'esports', name: 'E스포츠', emoji: '🎮', desc: 'AI 분석이 지원되는 E스포츠 경기를 확인하세요.' },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">스포츠 경기 분석 플랫폼</h1>
          <p className="hero-desc">AI 기반 경기 분석으로 더 깊은 스포츠 인사이트를 경험하세요.</p>
          <div className="hero-actions">
            <Link to="/matches" className="btn btn-primary btn-lg">경기 목록 보기</Link>
            <Link to="/sports/soccer" className="btn btn-outline btn-lg">축구 보기</Link>
          </div>
        </div>
      </section>

      <section className="sports-section">
        <h2 className="section-title">종목 선택</h2>
        <div className="sport-cards">
          {sports.map((sport) => (
            <Link to={`/sports/${sport.id}`} key={sport.id} className="sport-card card">
              <div className="sport-emoji">{sport.emoji}</div>
              <h3>{sport.name}</h3>
              <p>{sport.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

## Task 8: Create Placeholder Pages and ErrorPage

**Files:**
- Create: `frontend/src/pages/MatchListPage.jsx`
- Create: `frontend/src/pages/MatchDetailPage.jsx`
- Create: `frontend/src/pages/FavoritesPage.jsx`
- Create: `frontend/src/pages/SportsPage.jsx`
- Create: `frontend/src/pages/AdminDashboardPage.jsx`
- Create: `frontend/src/pages/ErrorPage.jsx`

- [ ] **Step 1: Create `src/pages/MatchListPage.jsx`**

```jsx
export default function MatchListPage() {
  return (
    <div className="placeholder-page">
      <h1>Match list page ready</h1>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/pages/MatchDetailPage.jsx`**

```jsx
export default function MatchDetailPage() {
  return (
    <div className="placeholder-page">
      <h1>Match detail page ready</h1>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/pages/FavoritesPage.jsx`**

```jsx
export default function FavoritesPage() {
  return (
    <div className="placeholder-page">
      <h1>Favorites page ready</h1>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/pages/SportsPage.jsx`**

```jsx
export default function SportsPage() {
  return (
    <div className="placeholder-page">
      <h1>Sports page ready</h1>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/pages/AdminDashboardPage.jsx`**

```jsx
export default function AdminDashboardPage() {
  return (
    <div className="placeholder-page">
      <h1>Admin dashboard ready</h1>
    </div>
  );
}
```

- [ ] **Step 6: Create `src/pages/ErrorPage.jsx`**

```jsx
import { Link } from 'react-router-dom';

export default function ErrorPage() {
  return (
    <div className="page-center">
      <div className="card error-page-card">
        <h1>404</h1>
        <p>페이지를 찾을 수 없습니다.</p>
        <Link to="/" className="btn btn-primary">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
```

---

## Task 9: Create AppRouter and Wire Up App

**Files:**
- Create: `frontend/src/router/AppRouter.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/vite.config.js`
- Clear: `frontend/src/App.css` (keep file, empty it)

- [ ] **Step 1: Create `src/router/AppRouter.jsx`**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import Layout from '../components/Layout';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MatchListPage from '../pages/MatchListPage';
import MatchDetailPage from '../pages/MatchDetailPage';
import FavoritesPage from '../pages/FavoritesPage';
import SportsPage from '../pages/SportsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import ErrorPage from '../pages/ErrorPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="matches" element={<MatchListPage />} />
            <Route path="matches/:matchId" element={<MatchDetailPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="sports/:sportType" element={<SportsPage />} />
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<ErrorPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Overwrite `src/App.jsx`**

```jsx
import AppRouter from './router/AppRouter';

export default function App() {
  return <AppRouter />;
}
```

- [ ] **Step 3: Overwrite `src/main.jsx`**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Clear `src/App.css`**

Overwrite `src/App.css` with empty content (just a comment):

```css
/* Styles moved to src/styles/ */
```

- [ ] **Step 5: Update `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
```

---

## Task 10: Verify Build

**Working directory: `E:\web3\web-sport-react-rebuild\frontend`**

- [ ] **Step 1: Run frontend build**

```powershell
npm run build
```

Expected output:
```
✓ built in Xs
```

If build fails, read the error carefully:
- `Cannot find module '...'` → a file import path is wrong or the file doesn't exist
- `useAuth must be used inside AuthProvider` → component tree issue in AppRouter
- CSS errors → check for unclosed rules in the CSS files

- [ ] **Step 2: Verify backend still compiles (run from project root)**

```powershell
cd ..
.\mvnw.cmd compile
```

Expected: `BUILD SUCCESS`

---

## Summary

### Files Created
**API:** `axiosInstance.js`, `authApi.js`  
**Hook:** `useAuth.js` (includes `AuthProvider`)  
**CSS:** `global.css`, `layout.css`, `components.css`  
**Components:** `Header.jsx`, `Layout.jsx`, `LoadingState.jsx`, `EmptyState.jsx`, `ErrorBox.jsx`  
**Router:** `AppRouter.jsx`  
**Pages:** `HomePage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `MatchListPage.jsx`, `MatchDetailPage.jsx`, `FavoritesPage.jsx`, `SportsPage.jsx`, `AdminDashboardPage.jsx`, `ErrorPage.jsx`

### How to Run Frontend
```powershell
cd frontend
npm run dev
```
Open `http://localhost:5173` in a browser. Backend must be running at `http://localhost:8080`.

### How to Test Login/Register
1. Start backend: `.\mvnw.cmd spring-boot:run` (from project root)
2. Start frontend: `npm run dev` (from `frontend/`)
3. Navigate to `http://localhost:5173/register` → create account
4. Navigate to `http://localhost:5173/login` → log in
5. Header should show nickname/username and Logout button
6. Click Logout → returns to home, shows Login/Register

### Next Recommended Step
**Phase 3A: Implement MatchListPage** — connect `GET /api/matches` with filter UI (sport, date, status, league), pagination, and match cards.
