import { useNavigate } from 'react-router-dom';
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

function teamName(team) {
  return team?.teamName || team?.shortName || team?.name || '팀 정보 준비 중';
}

function CompactTeamRow({ team, score }) {
  return (
    <div className="compact-team-row">
      <TeamLogo team={team} size={30} radius={8} />
      <span className="compact-team-name">{team?.shortName || teamName(team)}</span>
      {score !== null && score !== undefined && <span className="compact-score">{score}</span>}
    </div>
  );
}

export default function MatchCard({ match, compact, detailPath }) {
  const navigate = useNavigate();
  const hasScore = match.homeScore !== null && match.homeScore !== undefined
    && match.awayScore !== null && match.awayScore !== undefined;
  const target = detailPath || `/matches/${match.id}`;

  return (
    <article
      className={`match-card card${compact ? ' match-card-compact' : ''}`}
      onClick={() => navigate(target)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') navigate(target);
      }}
    >
      <div className="match-card-header">
        <span className="sport-tag">{SPORT_LABELS[match.sportType] || match.sportType || '스포츠'}</span>
        <StatusBadge status={match.status} />
      </div>

      {match.league && <p className="match-league">{match.league.leagueName}</p>}

      {compact ? (
        <div className="compact-teams">
          <CompactTeamRow team={match.homeTeam} score={hasScore ? match.homeScore : null} />
          <CompactTeamRow team={match.awayTeam} score={hasScore ? match.awayScore : null} />
        </div>
      ) : (
        <div className="match-teams">
          <div className="team home-team">
            <TeamLogo team={match.homeTeam} size={38} radius={10} />
            <span className="team-name">{teamName(match.homeTeam)}</span>
            {hasScore && <span className="score">{match.homeScore}</span>}
          </div>
          <div className="match-vs">VS</div>
          <div className="team away-team">
            {hasScore && <span className="score">{match.awayScore}</span>}
            <span className="team-name">{teamName(match.awayTeam)}</span>
            <TeamLogo team={match.awayTeam} size={38} radius={10} />
          </div>
        </div>
      )}

      <div className="match-meta">
        {match.matchDate && <span className="match-date">{formatDate(match.matchDate)}</span>}
        {match.venue && <span className="match-venue">장소 {match.venue}</span>}
      </div>
    </article>
  );
}
