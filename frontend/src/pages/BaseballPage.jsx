import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMlbSchedule } from '../api/mlb'

// Today's date in YYYY-MM-DD (local).
const today = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export default function BaseballPage() {
  const [date, setDate] = useState(today())
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const data = await fetchMlbSchedule(date)
      setGames(data)
      setLoaded(true)
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Failed to fetch MLB schedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Baseball (MLB)</h2>
      <p className="muted">Live schedule pulled from the MLB Stats API via our Spring Boot backend.</p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0' }}>
        <label className="muted">Date:</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #2c3340', background: '#0f1115', color: '#fff' }}
        />
        <button className="btn primary" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch MLB Games'}
        </button>
        <button className="btn" onClick={load} disabled={loading} title="Manual refresh">Refresh</button>
      </div>

      {err && <p style={{ color: 'salmon' }}>Error: {err}</p>}

      {loaded && !loading && games.length === 0 && (
        <p className="muted">No MLB games found for {date}.</p>
      )}

      {games.map(g => {
        const time = g.gameDate ? new Date(g.gameDate).toLocaleString() : ''
        return (
          <div key={g.gamePk} className="match-row">
            <div>
              <div className="teams">{g.awayTeam} @ {g.homeTeam}</div>
              <div className="meta">
                #{g.gamePk} • {time} • {g.venue || 'TBD'} • {g.status || ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="score">
                {g.awayScore ?? '-'} : {g.homeScore ?? '-'}
              </div>
              <Link to={`/baseball/${g.gamePk}`} className="btn">Detail</Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
