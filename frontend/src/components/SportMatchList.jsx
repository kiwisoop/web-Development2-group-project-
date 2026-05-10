import { useEffect, useState } from 'react'
import { fetchMatches } from '../api/matches'
import MatchCard from './MatchCard'

// Generic list used by every sport page. Pass sportType.
export default function SportMatchList({ sportType, title }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchMatches(sportType)
      .then(setMatches)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [sportType])

  return (
    <div>
      <h2>{title}</h2>
      {loading && <p className="muted">Loading...</p>}
      {err && <p style={{ color: 'salmon' }}>Error: {err}</p>}
      {!loading && matches.length === 0 && <p className="muted">No matches found.</p>}
      {matches.map(m => <MatchCard key={m.id} match={m} />)}
    </div>
  )
}
