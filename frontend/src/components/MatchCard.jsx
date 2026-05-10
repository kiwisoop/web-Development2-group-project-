import { Link } from 'react-router-dom'

// Reusable across all sport pages.
export default function MatchCard({ match }) {
  const date = match.matchDate ? new Date(match.matchDate).toLocaleString() : ''
  return (
    <div className="match-row">
      <div>
        <div className="teams">{match.homeTeam} vs {match.awayTeam}</div>
        <div className="meta">{match.leagueName} • {date} • {match.status}</div>
      </div>
      <div className="score">{match.homeScore ?? '-'} : {match.awayScore ?? '-'}</div>
      <Link className="btn" to={`/matches/${match.id}`}>Detail</Link>
    </div>
  )
}
