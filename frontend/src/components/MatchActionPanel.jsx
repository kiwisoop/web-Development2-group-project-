export default function MatchActionPanel({ match, isLoggedIn, favoriteTeamIds, onToggleFavorite, loadingTeamId }) {
  const homeTeamId = match.homeTeam?.id;
  const awayTeamId = match.awayTeam?.id;
  const homeIsFav = favoriteTeamIds?.has(homeTeamId);
  const awayIsFav = favoriteTeamIds?.has(awayTeamId);

  const renderTeamRow = (team, isFav, isLast) => {
    const teamId = team?.id;
    const isLoading = loadingTeamId === teamId;

    return (
      <div className={`fav-team-row${isLast ? '' : ' fav-team-row--divider'}`}>
        <div className="fav-team-info">
          {team?.logoUrl ? (
            <img className="fav-team-logo" src={team.logoUrl} alt={team.teamName} />
          ) : (
            <div className="fav-team-logo-fallback">{team?.shortName?.[0] || team?.teamName?.[0] || '?'}</div>
          )}
          <span className="fav-team-name">{team?.teamName || '팀 정보 없음'}</span>
        </div>
        <button
          className={`fav-heart-btn${isFav ? ' fav-heart-btn--active' : ''}`}
          onClick={() => isLoggedIn && onToggleFavorite(teamId)}
          disabled={isLoading || !teamId}
          title={!isLoggedIn ? '로그인 후 이용 가능' : isFav ? '관심 팀 해제' : '관심 팀 등록'}
          aria-label={isFav ? '관심 팀 해제' : '관심 팀 등록'}
        >
          {isLoading ? (
            <span className="fav-heart-spinner" />
          ) : (
            <span className="fav-heart-icon">{isFav ? '♥' : '♡'}</span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="detail-section">
      <h2 className="detail-section-title">관심 팀</h2>
      <div className="fav-team-card card">
        {renderTeamRow(match.homeTeam, homeIsFav, false)}
        {renderTeamRow(match.awayTeam, awayIsFav, true)}
        {!isLoggedIn && (
          <p className="notice-text">로그인 후 관심 팀을 등록할 수 있습니다.</p>
        )}
      </div>
    </div>
  );
}
