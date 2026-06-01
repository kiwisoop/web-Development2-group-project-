import StatusBadge from './StatusBadge';
import TeamLogo from './TeamLogo';

const SPORT_LABELS = {
  SOCCER: '축구',
  BASEBALL: '야구',
  ESPORTS: 'e스포츠',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR', {
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
  const homeWon = hasScore && Number(match.homeScore) > Number(match.awayScore);
  const awayWon = hasScore && Number(match.awayScore) > Number(match.homeScore);

  return (
    <div className="scoreboard card">
      <div className="scoreboard-meta">
        <span className="sport-label">{SPORT_LABELS[match.sportType] || match.sportType || '스포츠'}</span>
        <StatusBadge status={match.status} />
        {match.league && <span className="scoreboard-league">{match.league.leagueName}</span>}
      </div>

      <div className="scoreboard-teams">
        <div className={`team-block team-block--home${homeWon ? ' team-block--winner' : ''}`}>
          <TeamLogo team={match.homeTeam} size={52} radius={14} />
          <span className="team-block-side">홈</span>
          <span className="team-block-name">{match.homeTeam?.teamName || '홈팀'}</span>
          {match.homeTeam?.shortName && <span className="team-block-code">{match.homeTeam.shortName}</span>}
        </div>

        <div className="score-display">
          {hasScore ? (
            <>
              <span className={`score-num${homeWon ? ' score-num--winner' : ''}`}>{match.homeScore}</span>
              <span className="score-sep">:</span>
              <span className={`score-num${awayWon ? ' score-num--winner' : ''}`}>{match.awayScore}</span>
            </>
          ) : (
            <span className="score-sep">VS</span>
          )}
        </div>

        <div className={`team-block team-block--away${awayWon ? ' team-block--winner' : ''}`}>
          <TeamLogo team={match.awayTeam} size={52} radius={14} />
          <span className="team-block-side">원정</span>
          <span className="team-block-name">{match.awayTeam?.teamName || '원정팀'}</span>
          {match.awayTeam?.shortName && <span className="team-block-code">{match.awayTeam.shortName}</span>}
        </div>
      </div>

      <div className="scoreboard-footer">
        {match.matchDate && <span>{formatDate(match.matchDate)}</span>}
        {match.venue && <span>{match.venue}</span>}
      </div>
    </div>
  );
}
