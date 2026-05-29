import { useNavigate } from 'react-router-dom';
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

function CompactTeamRow({ team, score }) {
  const abbr = (team?.shortName || team?.teamName || '?').slice(0, 3);
  return (
    <div className="compact-team-row">
      {team?.logoUrl ? (
        <img
          className="team-logo-compact"
          src={team.logoUrl}
          alt={abbr}
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <span
        className="team-logo-fallback"
        style={team?.logoUrl ? { display: 'none' } : {}}
      >
        {abbr}
      </span>
      <span className="compact-team-name">
        {team?.shortName || team?.teamName || '?'}
      </span>
      {score !== null && <span className="compact-score">{score}</span>}
    </div>
  );
}

export default function MatchCard({ match, compact }) {
  const navigate = useNavigate();
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;

  return (
    <div
      className={`match-card card${compact ? ' match-card-compact' : ''}`}
      onClick={() => navigate(`/matches/${match.id}`)}
    >
      <div className="match-card-header">
        <span className="sport-tag">{SPORT_LABELS[match.sportType] || match.sportType}</span>
        <StatusBadge match={match} />
      </div>

      {match.league && (
        <p className="match-league">{match.league.leagueName}</p>
      )}

      {compact ? (
        <div className="compact-teams">
          <CompactTeamRow team={match.homeTeam} score={hasScore ? match.homeScore : null} />
          <CompactTeamRow team={match.awayTeam} score={hasScore ? match.awayScore : null} />
        </div>
      ) : (
        <div className="match-teams">
          <div className="team home-team">
            <span className="team-name">{match.homeTeam?.teamName || '홈팀'}</span>
            {hasScore && <span className="score">{match.homeScore}</span>}
          </div>
          <div className="match-vs">VS</div>
          <div className="team away-team">
            {hasScore && <span className="score">{match.awayScore}</span>}
            <span className="team-name">{match.awayTeam?.teamName || '원정팀'}</span>
          </div>
        </div>
      )}

      <div className="match-meta">
        {match.matchDate && <span className="match-date">{formatDate(match.matchDate)}</span>}
        {match.venue && <span className="match-venue">📍 {match.venue}</span>}
      </div>
    </div>
  );
}
