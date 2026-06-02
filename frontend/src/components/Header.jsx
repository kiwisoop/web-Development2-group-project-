import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, isLoggedIn, isAdmin, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  // 아바타 이니셜
  const initials = (() => {
    const n = user?.nickname || user?.username || '';
    return n ? n.charAt(0).toUpperCase() : '?';
  })();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">Sport Analysis</Link>
        <nav className="nav" aria-label="주요 메뉴">
          <NavLink to="/" end>홈</NavLink>
          <NavLink to="/sports/baseball">야구</NavLink>
          <NavLink to="/matches">경기센터</NavLink>
          <NavLink to="/analysis">분석</NavLink>
          <NavLink to="/rankings">순위</NavLink>
          <NavLink to="/sports">스포츠</NavLink>
          {isLoggedIn && <NavLink to="/favorites">즐겨찾기</NavLink>}
          {isAdmin && <NavLink to="/admin">관리자</NavLink>}
        </nav>
        <div className="auth-section">
          {isLoggedIn ? (
            <>
              <div className="user-pill">
                <div className="user-avatar">{initials}</div>
                <div className="user-meta">
                  <b>{user?.nickname || user?.username}</b>
                  <small>{user?.role === 'ADMIN' ? 'Admin' : 'User'}</small>
                </div>
              </div>
              <button className="btn btn-outline" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">로그인</Link>
              <Link to="/register" className="btn btn-primary">회원가입</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
