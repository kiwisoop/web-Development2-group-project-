import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const I = {
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  play: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  rank: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  ai: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  sport: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/></svg>,
  admin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

export default function Sidebar() {
  const { user, isLoggedIn, isAdmin, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠어요?')) return;
    await logoutUser();
    navigate('/');
  };

  const cls = ({isActive}) => `sl-nav-item${isActive ? ' active' : ''}`;

  return (
    <aside className="sl-sidebar">
      <NavLink to="/" end className="sl-logo">
        <div className="sl-logo-mark">{I.arrow}</div>
        <div className="sl-logo-text">
          Sport Analysis
          <small>Analytics · 2026</small>
        </div>
      </NavLink>

      <div className="sl-nav-title">메인</div>
      <NavLink to="/" end className={cls}>{I.grid} 홈</NavLink>
      <NavLink to="/matches" className={cls}>{I.play} 경기센터 <span className="sl-badge">LIVE</span></NavLink>
      <NavLink to="/analysis" className={cls}>{I.ai} AI 분석</NavLink>
      <NavLink to="/rankings" className={cls}>{I.rank} 순위</NavLink>
      <NavLink to="/sports" className={cls}>{I.sport} 스포츠</NavLink>

      {isLoggedIn && (
        <>
          <div className="sl-nav-title">개인</div>
          <NavLink to="/favorites" className={cls}>{I.star} 내 팀</NavLink>
          <NavLink to="/settings" className={cls}>{I.settings} 설정</NavLink>
        </>
      )}

      {isAdmin && (
        <>
          <div className="sl-nav-title">관리</div>
          <NavLink to="/admin" className={cls}>{I.admin} 관리자 대시보드</NavLink>
        </>
      )}

      <div className="sl-sidebar-footer">
        {isLoggedIn ? (
          <>
            <h4>{user?.nickname || user?.username}</h4>
            <p>{isAdmin ? '관리자 권한 활성' : '즐겨찾기 · 경기 참여 활성'}</p>
            <button onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <h4>로그인이 필요해요</h4>
            <p>즐겨찾기와 경기 참여 기능 사용</p>
            <button onClick={() => navigate('/login?back=' + encodeURIComponent(location.pathname))}>로그인하기</button>
          </>
        )}
      </div>
    </aside>
  );
}
