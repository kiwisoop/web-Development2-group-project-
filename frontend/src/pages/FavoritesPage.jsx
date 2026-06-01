import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFavoriteTeams, removeFavoriteTeam } from '../api/favoriteApi';
import TeamLogo from '../components/TeamLogo';

const SETTINGS_KEY = 'sport-analysis.settings';

function readLocalProfile() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function teamName(team) {
  if (!team) return '?';
  return team.teamName || team.name || team.shortName || '?';
}

function sportLabel(sportType) {
  return {
    BASEBALL: '야구',
    SOCCER: '축구',
    ESPORTS: 'e스포츠',
  }[sportType] || sportType || '';
}

function sportEmoji(sportType) {
  return {
    BASEBALL: '⚾',
    SOCCER: '⚽',
    ESPORTS: '🎮',
  }[sportType] || '🏟';
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
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

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErr(null);

    getFavoriteTeams(controller.signal)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setFavorites(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (e.code === 'ERR_CANCELED') return;
        setErr(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleRemove = async (favoriteId) => {
    if (!confirm('즐겨찾기에서 제거하시겠어요?')) return;
    try {
      await removeFavoriteTeam(favoriteId);
      setFavorites((list) => list.filter((f) => f.id !== favoriteId));
    } catch (e) {
      alert(`제거 실패: ${e.response?.data?.message || e.message}`);
    }
  };

  const displayName = localProfile.nickname || user?.nickname || user?.username;
  const initials = (displayName || '?').charAt(0).toUpperCase();
  const sportCount = new Set(
    favorites
      .map((item) => (item.team || item)?.sportType)
      .filter(Boolean)
  ).size;

  return (
    <>
      <section className="sl-profile-hero">
        {localProfile.photoDataUrl ? (
          <img className="sl-profile-avatar" src={localProfile.photoDataUrl} alt="" />
        ) : (
          <div className="sl-profile-avatar">{initials}</div>
        )}
        <div className="sl-profile-info">
          <h1>
            {displayName}
            <span className="sl-profile-tag">{user?.role === 'ADMIN' ? '관리자' : 'VIP 회원'}</span>
          </h1>
          <div className="sl-profile-sub">@{user?.username} · Sport Analysis 회원</div>
          <div className="sl-profile-stats">
            <div><b>{favorites.length}</b><small>즐겨찾기 팀</small></div>
            <div><b>{sportCount}</b><small>관심 종목</small></div>
          </div>
        </div>
        <div className="sl-profile-actions">
          <Link to="/settings" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            프로필 편집
          </Link>
        </div>
      </section>

      <div className="sl-pill-tabs">
        <button className="sl-pill-tab active" type="button">
          즐겨찾기 팀<span className="cnt">{favorites.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="sl-card" style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          불러오는 중...
        </div>
      ) : err ? (
        <div className="sl-card" style={{ padding: 32, color: '#ff8aa3' }}>
          즐겨찾기를 불러오지 못했어요. 백엔드 서버 연결을 확인해주세요.
        </div>
      ) : (
        <div className="sl-fav-grid">
          {favorites.length === 0 && (
            <div className="sl-card" style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <h4 style={{ fontSize: 15, marginBottom: 6, color: 'var(--color-text)' }}>아직 즐겨찾기 팀이 없어요</h4>
              <p>경기 상세 페이지에서 관심 팀을 추가할 수 있습니다.</p>
              <Link to="/matches" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>경기 보러가기</Link>
            </div>
          )}

          {favorites.map((f) => {
            const team = f.team || f;
            return (
              <div key={f.id} className="sl-fav-card">
                <div className="glow" style={{ background: team.teamColor || 'var(--accent-violet)' }} />
                <div className="top">
                  <TeamLogo team={team} size={64} radius={16} />
                  <button className="star-btn" onClick={() => handleRemove(f.id)} title="즐겨찾기 해제">
                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  </button>
                </div>
                <div className="name">{teamName(team)}</div>
                <div className="league">{sportEmoji(team.sportType)} {team.leagueName || sportLabel(team.sportType)}</div>
                <div className="meta">
                  <div className="meta-item">
                    <div className="label">팀 ID</div>
                    <div className="value">{team.id ?? '-'}</div>
                  </div>
                  <div className="meta-item">
                    <div className="label">국가</div>
                    <div className="value">{team.country || 'KR'}</div>
                  </div>
                  <div className="meta-item">
                    <div className="label">종목</div>
                    <div className="value">{team.sportType || '-'}</div>
                  </div>
                </div>
                <div className="next"><Link to="/matches">경기 일정 보기 →</Link></div>
              </div>
            );
          })}

          <Link to="/matches" className="sl-fav-card sl-fav-add">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, color: 'var(--color-text-muted)', marginBottom: 8 }}>+</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>팀 추가하기</div>
            </div>
          </Link>
        </div>
      )}
    </>
  );
}
