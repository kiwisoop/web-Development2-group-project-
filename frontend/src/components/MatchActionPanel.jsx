export default function MatchActionPanel({ match, isLoggedIn, favoriteTeamIds, onToggleFavorite, loadingTeamId }) {
  const homeTeamId = match.homeTeam?.id;
  const awayTeamId = match.awayTeam?.id;
  const homeIsFav = favoriteTeamIds?.has(homeTeamId);
  const awayIsFav = favoriteTeamIds?.has(awayTeamId);

  return (
    <div className="detail-section">
      <h2 className="detail-section-title">관심 팀</h2>
      <div className="action-panel card">
        <div className="action-row">
          <span className="action-team-name">{match.homeTeam?.teamName || '홈팀'}</span>
          {isLoggedIn ? (
            <button
              className={`btn ${homeIsFav ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => onToggleFavorite(homeTeamId)}
              disabled={loadingTeamId === homeTeamId || !homeTeamId}
            >
              {loadingTeamId === homeTeamId ? '처리 중...' : homeIsFav ? '관심 팀 해제' : '관심 팀 등록'}
            </button>
          ) : (
            <button className="btn btn-outline" disabled>관심 팀 등록</button>
          )}
        </div>
        <div className="action-row">
          <span className="action-team-name">{match.awayTeam?.teamName || '원정팀'}</span>
          {isLoggedIn ? (
            <button
              className={`btn ${awayIsFav ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => onToggleFavorite(awayTeamId)}
              disabled={loadingTeamId === awayTeamId || !awayTeamId}
            >
              {loadingTeamId === awayTeamId ? '처리 중...' : awayIsFav ? '관심 팀 해제' : '관심 팀 등록'}
            </button>
          ) : (
            <button className="btn btn-outline" disabled>관심 팀 등록</button>
          )}
        </div>
        {!isLoggedIn && (
          <p className="notice-text">로그인 후 관심 팀을 등록할 수 있습니다.</p>
        )}
      </div>
    </div>
  );
}
