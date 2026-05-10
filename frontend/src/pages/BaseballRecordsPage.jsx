import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMlbRecordsDashboard } from '../api/mlb'

const TABS = [
  { key: 'standings', label: 'Team Standings' },
  { key: 'team', label: 'Team Records' },
  { key: 'hitting', label: 'Hitter Records' },
  { key: 'pitching', label: 'Pitcher Records' },
]

const seasonOptions = (() => {
  const now = new Date().getFullYear()
  const arr = []
  for (let y = now; y >= now - 6; y--) arr.push(y)
  return arr
})()

function StandingsTable({ standings }) {
  const groups = useMemo(() => {
    const map = new Map()
    for (const t of standings || []) {
      const key = t.division || t.league || 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const ar = a.divisionRank ?? 99
        const br = b.divisionRank ?? 99
        if (ar !== br) return ar - br
        return (b.wins ?? 0) - (a.wins ?? 0)
      })
    }
    return Array.from(map.entries())
  }, [standings])

  if (!standings || standings.length === 0) {
    return <div className="notice">No standings data available.</div>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>W</th>
            <th>L</th>
            <th>PCT</th>
            <th>GB</th>
            <th>STRK</th>
            <th>RS</th>
            <th>RA</th>
            <th>DIFF</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(([groupName, teams]) => (
            <Fragment key={groupName}>
              <tr className="division-row">
                <td colSpan={10}>{groupName}</td>
              </tr>
              {teams.map((t, i) => (
                <tr key={`${groupName}-${t.teamId ?? t.teamName ?? i}`}>
                  <td>{t.divisionRank ?? i + 1}</td>
                  <td>{t.teamName || '-'}</td>
                  <td>{t.wins ?? '-'}</td>
                  <td>{t.losses ?? '-'}</td>
                  <td>{t.winningPercentage || '-'}</td>
                  <td>{t.gamesBack || '-'}</td>
                  <td>{t.streak || '-'}</td>
                  <td>{t.runsScored ?? '-'}</td>
                  <td>{t.runsAllowed ?? '-'}</td>
                  <td style={{ color: (t.runDifferential ?? 0) >= 0 ? '#7dd3fc' : '#fca5a5' }}>
                    {t.runDifferential == null
                      ? '-'
                      : (t.runDifferential >= 0 ? `+${t.runDifferential}` : t.runDifferential)}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TeamRecordCards({ cards }) {
  if (!cards || cards.length === 0) {
    return <div className="notice">No team record cards available.</div>
  }
  return (
    <div className="record-cards">
      {cards.map((c, i) => (
        <div key={`${c.label}-${i}`} className="record-card">
          <div className="label">{c.label}</div>
          <div className="value">{c.value || '-'}</div>
          <div className="team-name">{c.teamName || '-'}</div>
        </div>
      ))}
    </div>
  )
}

function LeaderGrid({ groups }) {
  if (!groups || groups.length === 0) {
    return <div className="notice">No leaders data available.</div>
  }
  return (
    <div className="leader-grid">
      {groups.map(g => (
        <div key={g.category} className="card leader-card">
          <h4>{g.label || g.category}</h4>
          {(!g.leaders || g.leaders.length === 0) ? (
            <p className="muted" style={{ margin: 0 }}>No data.</p>
          ) : (
            <ol className="leader-list">
              {g.leaders.map((l, i) => (
                <li key={`${l.playerId ?? l.playerName}-${i}`}>
                  <span className="rank">{l.rank ?? i + 1}</span>
                  <span className="player">
                    {l.playerName || '-'}
                    {l.teamName && <span className="team">{l.teamName}</span>}
                  </span>
                  <span className="value">{l.value ?? '-'}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  )
}

export default function BaseballRecordsPage() {
  const [season, setSeason] = useState(seasonOptions[0])
  const [tab, setTab] = useState('standings')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = async (s = season) => {
    setLoading(true); setErr('')
    try {
      const d = await fetchMlbRecordsDashboard(s, 10)
      setData(d)
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Failed to fetch records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(season)
    // eslint-disable-next-line
  }, [season])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px', flexWrap: 'wrap' }}>
        <Link to="/baseball" className="btn">← Back to Schedule</Link>
        <h2 style={{ margin: 0 }}>Baseball — Records & Stats</h2>
        <span className="spacer" style={{ flex: 1 }} />
        <label className="muted" htmlFor="bb-season">Season</label>
        <select
          id="bb-season"
          value={season}
          onChange={e => setSeason(Number(e.target.value))}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #2c3340', background: '#0f1115', color: '#fff' }}
        >
          {seasonOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn primary" onClick={() => load(season)} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {err && <p style={{ color: 'salmon' }}>Error: {err}</p>}

      {loading && !data && <p className="muted">Loading {season} season records...</p>}

      {data && (
        <>
          {tab === 'standings' && <StandingsTable standings={data.standings} />}
          {tab === 'team' && <TeamRecordCards cards={data.teamRecordCards} />}
          {tab === 'hitting' && <LeaderGrid groups={data.hittingLeaders} />}
          {tab === 'pitching' && <LeaderGrid groups={data.pitchingLeaders} />}
        </>
      )}
    </div>
  )
}
