import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ErrorBox from './ErrorBox';

/**
 * 공통 인증 쉘 (로그인/회원가입 통합)
 * mode: 'login' | 'register'
 */
export default function AuthShell({ mode = 'login' }) {
  const { isLoggedIn, loginUser, registerUser, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', nickname: '', password: '' });
  const [pwScore, setPwScore] = useState(0);

  // 이미 로그인 상태면 홈으로
  useEffect(() => {
    if (isLoggedIn) {
      const back = new URLSearchParams(location.search).get('back') || '/';
      navigate(back, { replace: true });
    }
  }, [isLoggedIn, navigate, location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'password' && mode === 'register') {
      let score = 0;
      if (value.length >= 8) score++;
      if (/[A-Z]/.test(value)) score++;
      if (/[0-9]/.test(value)) score++;
      if (/[^A-Za-z0-9]/.test(value)) score++;
      setPwScore(score);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await loginUser({ username: form.username, password: form.password });
        const back = new URLSearchParams(location.search).get('back') || '/';
        navigate(back, { replace: true });
      } else {
        await registerUser(form);
        // 가입 후 자동 로그인 시도
        try {
          await loginUser({ username: form.username, password: form.password });
          navigate('/', { replace: true });
        } catch {
          navigate('/login', { replace: true });
        }
      }
    } catch {
      // useAuth에 error 저장됨
    }
  };

  const pwColors = ['var(--loss-red)', 'var(--accent-orange)', 'var(--accent-cyan)', 'var(--win-green)'];

  return (
    <div className="auth-page">
      <div className="auth-shell">

        {/* HERO 사이드 */}
        <div className="auth-hero">
          <Link to="/" className="auth-hero-logo">
            <div className="auth-hero-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <b>Sport Analysis<small>Analytics · 2026</small></b>
          </Link>

          <div className="auth-tagline">
            <h1>스포츠의 <mark>모든 순간</mark>을<br/>한눈에.</h1>
            <p>실시간 경기 · AI 분석 · 팬 예측 · 응원톡까지.<br/>당신의 응원이 데이터가 되는 곳.</p>
          </div>

          <div className="auth-features">
            <div className="auth-feat">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              MLB · K리그 · LCK 실시간 라이브 스코어
            </div>
            <div className="auth-feat">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              Groq AI 경기 분석 및 인사이트
            </div>
            <div className="auth-feat">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </div>
              경기별 실시간 응원톡 + 팬 예측 투표
            </div>
          </div>
        </div>

        {/* FORM 사이드 */}
        <div className="auth-form-side">
          <div className="auth-tabs">
            <Link to="/login" className={`auth-tab ${mode === 'login' ? 'active' : ''}`}>로그인</Link>
            <Link to="/register" className={`auth-tab ${mode === 'register' ? 'active' : ''}`}>회원가입</Link>
          </div>

          {mode === 'login' ? (
            <>
              <h2 className="auth-h">다시 만나서 반가워요 👋</h2>
              <p className="auth-sub">아이디와 비밀번호를 입력해 주세요.</p>
            </>
          ) : (
            <>
              <h2 className="auth-h">환영합니다! 🎉</h2>
              <p className="auth-sub">몇 가지 정보만 입력하면 바로 시작할 수 있어요.</p>
            </>
          )}

          <ErrorBox message={error} />

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">아이디</label>
              <input
                id="username" name="username" type="text"
                value={form.username} onChange={handleChange}
                placeholder={mode === 'login' ? 'demo / admin' : '4자 이상 영문/숫자'}
                required autoComplete={mode === 'login' ? 'username' : 'username'}
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="nickname">닉네임</label>
                <input
                  id="nickname" name="nickname" type="text"
                  value={form.nickname} onChange={handleChange}
                  placeholder="응원톡에서 사용됩니다"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password" name="password" type="password"
                value={form.password} onChange={handleChange}
                placeholder={mode === 'register' ? '8자 이상 · 대문자/숫자/특수문자 권장' : '••••••••'}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'register' && form.password && (
                <div className="pw-strength">
                  <div style={{
                    width: `${pwScore * 25}%`,
                    background: pwColors[Math.max(0, pwScore - 1)],
                    transition: 'all 0.3s'
                  }}/>
                </div>
              )}
            </div>

            {mode === 'login' && (
              <div className="form-check">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>로그인 상태 유지</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: mode === 'login' ? 4 : 12 }}
            >
              {loading ? '처리 중...' : (mode === 'login' ? '로그인 →' : '회원가입 완료 ✓')}
            </button>
          </form>

          <div className="auth-footer-link">
            {mode === 'login' ? (
              <>처음이신가요? <Link to="/register">회원가입하기</Link></>
            ) : (
              <>이미 계정이 있나요? <Link to="/login">로그인</Link></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
