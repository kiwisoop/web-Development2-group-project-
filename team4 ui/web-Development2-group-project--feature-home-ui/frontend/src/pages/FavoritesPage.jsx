import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFavoriteTeams, removeFavoriteTeam } from '../api/favoriteApi';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';

const SPORT_LABELS = {
  SOCCER: '⚽ 축구',
  BASEBALL: '⚾ 야구',
  ESPORTS: '🎮 E스포츠',
};

export default function FavoritesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getFavoriteTeams(controller.signal)
      .then((res) => setFavorites(res.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('관심 팀 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [isLoggedIn, authLoading]);

  const handleRemove = async (favoriteId) => {
    setRemovingId(favoriteId);
    try {
      await removeFavoriteTeam(favoriteId);
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch {
      // silently fail — retry by refreshing page
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || loading) return <LoadingState />;

  if (!isLoggedIn) {
    return (
      <div className="favorites-page">
        <h1 className="page-title">관심 팀</h1>
        <div className="login-notice card">
          <p>로그인 후 관심 팀을 확인할 수 있습니다.</p>
          <Link to="/login" className="btn btn-primary">로그인하기</Link>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="favorites-page">
      <h1 className="page-title">관심 팀</h1>
      <ErrorBox message={error} />
    </div>
  );

  return (
    <div className="favorites-page">
      <h1 className="page-title">관심 팀</h1>
      {favorites.length === 0 ? (
        <EmptyState
          title="관심 팀이 없습니다"
          description="경기 상세 페이지에서 팀을 관심 팀으로 등록해 보세요."
        />
      ) : (
        <div className="favorite-grid">
          {favorites.map((fav) => (
            <div key={fav.id} className="favorite-card card">
              <div className="favorite-card-header">
                <span className="favorite-sport-label">
                  {SPORT_LABELS[fav.sportType] || fav.sportType}
                </span>
              </div>
              <p className="favorite-team-name">{fav.teamName}</p>
              {fav.team?.leagueName && (
                <p className="favorite-league-name">{fav.team.leagueName}</p>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleRemove(fav.id)}
                disabled={removingId === fav.id}
              >
                {removingId === fav.id ? '처리 중...' : '관심 팀 해제'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
