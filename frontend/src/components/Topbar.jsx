import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const SETTINGS_KEY = 'sport-analysis.settings';

function readLocalProfile() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function Topbar() {
  const { user, isLoggedIn, isAdmin, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [localProfile, setLocalProfile] = useState(() => readLocalProfile());

  useEffect(() => {
    const refresh = () => setLocalProfile(readLocalProfile());
    window.addEventListener('storage', refresh);
    window.addEventListener('sport-analysis-settings-change', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('sport-analysis-settings-change', refresh);
    };
  }, []);

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠어요?')) return;
    await logoutUser();
    navigate('/');
  };

  const initials = (() => {
    const n = localProfile.nickname || user?.nickname || user?.username || '';
    return n ? n.charAt(0).toUpperCase() : '?';
  })();

  const displayName = localProfile.nickname || user?.nickname || user?.username;

  return (
    <div className="sl-topbar">
      {/* 좌측 공백 (검색바 자리) */}
      <div style={{ flex: 1 }} />

      <div className="sl-top-actions">
        {isLoggedIn ? (
          <button className="sl-avatar-btn" onClick={handleLogout} type="button" aria-label="로그아웃">
            {localProfile.photoDataUrl ? (
              <img className="sl-avatar-img" src={localProfile.photoDataUrl} alt="" />
            ) : (
              <div className="sl-avatar-img">{initials}</div>
            )}
            <div className="sl-avatar-info">
              <b>{displayName}</b>
              <small>{isAdmin ? 'Admin' : 'User'}</small>
            </div>
          </button>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">로그인</Link>
            <Link to="/register" className="btn btn-primary">가입</Link>
          </>
        )}
      </div>
    </div>
  );
}
