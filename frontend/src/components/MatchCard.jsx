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

export default function MatchCard({ match, detailPath }) {
  const navigate = useNavigate();
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;
  const target = detailPath || `/matches/${match.id}`;

  return (
    <div className="match-card card" onClick={() => navigate(target)}>
      <div className="match-card-header">
        <span className="sport-tag">{SPORT_LABELS[match.sportType] || match.sportType}</span>
        <StatusBadge status={match.status} />
      </div>

      {match.league && (
        <p className="match-league">{match.league.leagueName}</p>
      )}

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

      <div className="match-meta">
        {match.matchDate && <span className="match-date">{formatDate(match.matchDate)}</span>}
        {match.venue && <span className="match-venue">📍 {match.venue}</span>}
      </div>
    </div>
  );
}
