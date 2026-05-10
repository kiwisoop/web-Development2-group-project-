import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchMlbGameDetail } from '../api/mlb'
import { addFavorite } from '../api/favorites'
import { getUser } from '../api/auth'
import BaseballScoreboard from '../components/BaseballScoreboard'
import BaseballEventTimeline from '../components/BaseballEventTimeline'
import BaseballSummaryCompareCard from '../components/BaseballSummaryCompareCard'

// Map MLB status text -> badge metadata.
function statusBadge(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('final') || s.includes('completed') || s.includes('game over')) {
    return { label: 'Final', cls: 'final', kind: 'final' }
  }
  if (s.includes('in progress') || s.includes('live') || s.includes('manager challenge')) {
    return { label: 'Live', cls: 'live', kind: 'live' }
  }
  if (s.includes('pre-game') || s.includes('warmup') || s.includes('pre game')) {
    return { label: 'Pre-Game', cls: 'pre', kind: 'pre' }
  }
  return { label: 'Scheduled', cls: 'scheduled', kind: 'scheduled' }
}

export default function BaseballDetailPage() {
  const { gamePk } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [favMsg, setFavMsg] = useState('')
  const [favErr, setFavErr] = useState('')
  const [favBusy, setFavBusy] = useState(false)
  const [savedTeams, setSavedTeams] = useState(() => new Set())

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const data = await fetchMlbGameDetail(gamePk)
      setDetail(data)
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Failed to fetch MLB game detail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [gamePk])

  const onFavorite = async (teamName) => {
    if (!teamName) return
    setFavMsg(''); setFavErr('')
    const user = getUser()
    if (!user) { setFavErr('Login first to add favorite teams.'); return }
    if (favBusy || savedTeams.has(teamName)) return
    setFavBusy(true)
    try {
      await addFavorite({ userId: user.id, sportType: 'BASEBALL', teamName })
      setSavedTeams(prev => {
        const next = new Set(prev); next.add(teamName); return next
      })
      setFavMsg(`Saved ${teamName} to your favorites.`)
    } catch (e) {
      setFavErr(e?.response?.data?.message || e.message || 'Failed to save favorite team.')
    } finally {
      setFavBusy(false)
    }
  }

  const time = detail?.gameDate ? new Date(detail.gameDate).toLocaleString() : ''
  const inningHalf = detail?.inningHalf
    ? `${detail.inningHalf.charAt(0).toUpperCase()}${detail.inningHalf.slice(1)}`
    : ''
  const inningLabel = detail?.currentInning
    ? `${inningHalf || ''} ${detail.currentInning}`.trim()
    : '-'

  const badge = detail ? statusBadge(detail.status) : null
  const notStarted = badge && (badge.kind === 'scheduled' || badge.kind === 'pre')

  const renderFavBtn = (teamName, role) => {
    const saved = savedTeams.has(teamName)
    const disabled = favBusy || !teamName || saved
    return (
      <button
        className="btn"
        onClick={() => onFavorite(teamName)}
        disabled={disabled}
        title={saved ? 'Already in favorites' : `Add ${teamName} to favorites`}
      >
        {saved ? `★ ${teamName} Saved` : `☆ Add ${teamName || role} to Favorites`}
      </button>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
        <Link to="/baseball" className="btn">← Back</Link>
        <h2 style={{ margin: 0 }}>Baseball — Game Detail</h2>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {err && <p style={{ color: 'salmon' }}>Error: {err}</p>}

      {!detail && !err && <p className="muted">Loading...</p>}

      {detail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#cbd1da' }}>
                Game #{detail.gamePk}
              </h3>
              {badge && <span className={`status-badge ${badge.cls}`}>{badge.label}</span>}
              <span className="spacer" style={{ flex: 1 }} />
              <span className="muted">{time}</span>
            </div>
            <div className="meta" style={{ marginBottom: 14 }}>
              {detail.venue || 'TBD'} • Status: {detail.status || '-'} • Current inning: <strong style={{ color: '#dbe1ee' }}>{inningLabel}</strong>
            </div>

            <div className="bb-scorepanel">
              <div className="team">
                <span className="role">Away</span>
                <span className="name">{detail.awayTeam || 'Away'}</span>
                <span className="runs">{detail.awayScore ?? '-'}</span>
              </div>
              <div className="vs">VS</div>
              <div className="team">
                <span className="role">Home</span>
                <span className="name">{detail.homeTeam || 'Home'}</span>
                <span className="runs">{detail.homeScore ?? '-'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              {renderFavBtn(detail.awayTeam, 'Away')}
              {renderFavBtn(detail.homeTeam, 'Home')}
            </div>
            {favMsg && <p style={{ color: '#7dd3fc', marginTop: 10, marginBottom: 0 }}>{favMsg}</p>}
            {favErr && <p style={{ color: 'salmon', marginTop: 10, marginBottom: 0 }}>{favErr}</p>}
          </div>

          {notStarted ? (
            <div className="notice">
              This game has not started yet. Scoreboard and events will appear after the game begins.
            </div>
          ) : (
            <>
              <section>
                <h3 style={{ margin: '0 0 8px' }}>Scoreboard</h3>
                <BaseballScoreboard detail={detail} />
              </section>

              <section>
                <h3 style={{ margin: '0 0 8px' }}>Event Timeline</h3>
                <BaseballEventTimeline events={detail.events} />
              </section>
            </>
          )}

          <BaseballSummaryCompareCard gamePk={gamePk} />
        </div>
      )}
    </div>
  )
}
