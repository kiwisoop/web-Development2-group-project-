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

function statusBadge(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('final') || s.includes('completed') || s.includes('game over')) {
    return { label: 'Final', cls: 'final' }
  }
  if (s.includes('in progress') || s.includes('live') || s.includes('manager challenge')) {
    return { label: 'Live', cls: 'live' }
  }
  if (s.includes('pre-game') || s.includes('warmup') || s.includes('pre game')) {
    return { label: 'Pre-Game', cls: 'pre' }
  }
  return { label: 'Scheduled', cls: 'scheduled' }
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
      <h2 style={{ marginBottom: 4 }}>Baseball (MLB)</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Live schedule pulled from the MLB Stats API via our Spring Boot backend.
      </p>

      <div
        className="card"
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          margin: '12px 0 16px',
        }}
      >
        <label className="muted" htmlFor="bb-date">Date</label>
        <input
          id="bb-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #2c3340', background: '#0f1115', color: '#fff' }}
        />
        <button className="btn primary" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch MLB Games'}
        </button>
        <button className="btn" onClick={load} disabled={loading} title="Manual refresh">Refresh</button>
        <span className="spacer" style={{ flex: 1 }} />
        {loaded && !loading && (
          <span className="muted">{games.length} game{games.length === 1 ? '' : 's'} on {date}</span>
        )}
      </div>

      {err && <p style={{ color: 'salmon' }}>Error: {err}</p>}

      {loaded && !loading && games.length === 0 && (
        <div className="notice" style={{ textAlign: 'center', padding: 24 }}>
          No MLB games found for <strong>{date}</strong>. Try another date.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {games.map(g => {
          const time = g.gameDate ? new Date(g.gameDate).toLocaleString() : ''
          const badge = statusBadge(g.status)
          return (
            <div key={g.gamePk} className="match-row" style={{ padding: '14px 16px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div className="teams">{g.awayTeam} @ {g.homeTeam}</div>
                  <span className={`status-badge sm ${badge.cls}`}>{badge.label}</span>
                </div>
                <div className="meta" style={{ marginTop: 6 }}>
                  #{g.gamePk} • {time} • {g.venue || 'TBD'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 12 }}>
                <div className="score" style={{ minWidth: 80, textAlign: 'right' }}>
                  {g.awayScore ?? '-'} : {g.homeScore ?? '-'}
                </div>
                <Link
                  to={`/baseball/${g.gamePk}`}
                  className="btn primary"
                  style={{ minWidth: 88, textAlign: 'center' }}
                >
                  Detail
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
