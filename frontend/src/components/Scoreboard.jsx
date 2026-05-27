import StatusBadge from './StatusBadge';

const SPORT_LABELS = {
  SOCCER: '⚽ 축구',
  BASEBALL: '⚾ 야구',
  ESPORTS: '🎮 E스포츠',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Scoreboard({ match }) {
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;

  return (
    <div className="scoreboard card">
      <div className="scoreboard-meta">
        <span className="sport-label">{SPORT_LABELS[match.sportType] || match.sportType || '스포츠'}</span>
        <StatusBadge status={match.status} />
        {match.league && <span className="scoreboard-league">{match.league.leagueName}</span>}
      </div>

      <div className="scoreboard-teams">
        <div className="team-block">
          <span className="team-block-name">{match.homeTeam?.teamName || '홈팀'}</span>
        </div>

        <div className="score-display">
          {hasScore ? (
            <>
              <span className="score-num">{match.homeScore}</span>
              <span className="score-sep">:</span>
              <span className="score-num">{match.awayScore}</span>
            </>
          ) : (
            <span className="score-sep">VS</span>
          )}
        </div>

        <div className="team-block">
          <span className="team-block-name">{match.awayTeam?.teamName || '원정팀'}</span>
        </div>
      </div>

      <div className="scoreboard-footer">
        {match.matchDate && <span>{formatDate(match.matchDate)}</span>}
        {match.venue && <span>📍 {match.venue}</span>}
      </div>
    </div>
  );
}
