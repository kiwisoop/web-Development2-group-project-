import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMlbMonthSchedule } from '../api/mlb'

const MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const DOW = ['일', '월', '화', '수', '목', '금', '토']

const yearOptions = (() => {
  const now = new Date().getFullYear()
  const arr = []
  for (let y = now + 1; y >= now - 4; y--) arr.push(y)
  return arr
})()

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

function toLocalDateKey(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateTitle(key) {
  if (!key) return ''
  const [y, m, day] = key.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  return `${m}월 ${day}일 (${DOW[d.getDay()]})`
}

function timeStr(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function TeamLogo({ teamId, teamName }) {
  const [failed, setFailed] = useState(false)
  if (!teamId || failed) return null
  return (
    <img
      className="team-logo"
      src={`https://www.mlbstatic.com/team-logos/${teamId}.svg`}
      alt={teamName || ''}
      onError={() => setFailed(true)}
    />
  )
}

export default function BaseballPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [teamFilter, setTeamFilter] = useState('ALL')

  const load = async (y = year, m = month) => {
    setLoading(true); setErr(''); setLoaded(false)
    try {
      const data = await fetchMlbMonthSchedule(y, m)
      setGames(Array.isArray(data) ? data : [])
      setLoaded(true)
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Failed to fetch MLB monthly schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(year, month)
    // eslint-disable-next-line
  }, [year, month])

  const teams = useMemo(() => {
    const set = new Set()
    for (const g of games) {
      if (g.awayTeam) set.add(g.awayTeam)
      if (g.homeTeam) set.add(g.homeTeam)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [games])

  // reset team filter if it isn't in the new month's team list
  useEffect(() => {
    if (teamFilter !== 'ALL' && !teams.includes(teamFilter)) {
      setTeamFilter('ALL')
    }
  }, [teams, teamFilter])

  const filtered = useMemo(() => {
    if (teamFilter === 'ALL') return games
    return games.filter(g => g.awayTeam === teamFilter || g.homeTeam === teamFilter)
  }, [games, teamFilter])

  const grouped = useMemo(() => {
    const map = {}
    for (const g of filtered) {
      const k = toLocalDateKey(g.gameDate) || 'unknown'
      if (!map[k]) map[k] = []
      map[k].push(g)
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.gameDate || '').localeCompare(b.gameDate || ''))
    }
    return map
  }, [filtered])

  const orderedDates = useMemo(
    () => Object.keys(grouped).sort((a, b) => a.localeCompare(b)),
    [grouped]
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
        <h2 style={{ margin: 0 }}>Baseball (MLB) — Monthly Schedule</h2>
        <span className="spacer" style={{ flex: 1 }} />
        <Link to="/baseball/records" className="btn primary">Records & Stats</Link>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Browse a full month of MLB games. Click a row to open the game detail.
      </p>

      <div className="card sched-toolbar">
        <label className="muted" htmlFor="bb-year">Year</label>
        <select id="bb-year" value={year} onChange={e => setYear(Number(e.target.value))}>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <label className="muted" htmlFor="bb-month">Month</label>
        <select id="bb-month" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>

        <button className="btn primary" onClick={() => load(year, month)} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Month'}
        </button>
        <button className="btn" onClick={() => load(year, month)} disabled={loading} title="Manual refresh">
          Refresh
        </button>

        <span className="spacer" style={{ flex: 1 }} />
        {loaded && !loading && (
          <span className="muted">
            {filtered.length} of {games.length} game{games.length === 1 ? '' : 's'} • {year}-{String(month).padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="month-tabs">
        {MONTHS.map(m => (
          <button
            key={m}
            className={`month-tab ${m === month ? 'active' : ''}`}
            onClick={() => setMonth(m)}
          >
            {m}월
          </button>
        ))}
      </div>

      {teams.length > 0 && (
        <div className="team-chips">
          <button
            className={`team-chip ${teamFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setTeamFilter('ALL')}
          >
            All ({games.length})
          </button>
          {teams.map(t => (
            <button
              key={t}
              className={`team-chip ${teamFilter === t ? 'active' : ''}`}
              onClick={() => setTeamFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {err && <p style={{ color: 'salmon' }}>Error: {err}</p>}

      {loading && !loaded && <p className="muted">Loading {year}-{String(month).padStart(2, '0')} schedule...</p>}

      {loaded && !loading && filtered.length === 0 && (
        <div className="notice" style={{ textAlign: 'center', padding: 24 }}>
          No MLB games found for <strong>{year}년 {month}월</strong>
          {teamFilter !== 'ALL' ? <> with team <strong>{teamFilter}</strong></> : null}.
        </div>
      )}

      {orderedDates.map(dateKey => (
        <div key={dateKey} className="date-group">
          <div className="date-title">{dateTitle(dateKey)}</div>
          {grouped[dateKey].map(g => {
            const badge = statusBadge(g.status)
            const homeWon = g.homeScore != null && g.awayScore != null && g.homeScore > g.awayScore
            const awayWon = g.homeScore != null && g.awayScore != null && g.awayScore > g.homeScore
            return (
              <div key={g.gamePk} className="sched-row">
                <div className="time">{timeStr(g.gameDate)}</div>
                <div className="side away">
                  <span className="team-name" style={{ opacity: awayWon ? 1 : (homeWon ? 0.7 : 1) }}>
                    {g.awayTeam || 'Away'}
                  </span>
                  <TeamLogo teamId={g.awayTeamId} teamName={g.awayTeam} />
                </div>
                <div className="center">
                  <div className="vs-score">
                    {g.awayScore != null || g.homeScore != null ? (
                      <>
                        <span style={{ opacity: awayWon ? 1 : 0.7 }}>{g.awayScore ?? '-'}</span>
                        <span className="dim"> : </span>
                        <span style={{ opacity: homeWon ? 1 : 0.7 }}>{g.homeScore ?? '-'}</span>
                      </>
                    ) : (
                      <span className="dim">VS</span>
                    )}
                  </div>
                  <span className={`status-badge sm ${badge.cls}`}>{badge.label}</span>
                </div>
                <div className="side home">
                  <TeamLogo teamId={g.homeTeamId} teamName={g.homeTeam} />
                  <span className="team-name" style={{ opacity: homeWon ? 1 : (awayWon ? 0.7 : 1) }}>
                    {g.homeTeam || 'Home'}
                  </span>
                </div>
                <Link
                  to={`/baseball/${g.gamePk}`}
                  className="btn detail-btn"
                  style={{ minWidth: 88, textAlign: 'center' }}
                >
                  Detail
                </Link>
                {g.venue && <div className="venue">📍 {g.venue}</div>}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
