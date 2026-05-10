import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchMlbGameDetail } from '../api/mlb'
import BaseballScoreboard from '../components/BaseballScoreboard'
import BaseballEventTimeline from '../components/BaseballEventTimeline'
import BaseballSummaryCompareCard from '../components/BaseballSummaryCompareCard'

export default function BaseballDetailPage() {
  const { gamePk } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

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

  const time = detail?.gameDate ? new Date(detail.gameDate).toLocaleString() : ''
  const inningHalf = detail?.inningHalf
    ? `${detail.inningHalf.charAt(0).toUpperCase()}${detail.inningHalf.slice(1)}`
    : ''
  const inningLabel = detail?.currentInning
    ? `${inningHalf || ''} ${detail.currentInning}`.trim()
    : '-'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px' }}>
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
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="teams" style={{ fontSize: 20, fontWeight: 700 }}>
                  {detail.awayTeam || 'Away'} @ {detail.homeTeam || 'Home'}
                </div>
                <div className="meta" style={{ marginTop: 4 }}>
                  #{detail.gamePk} • {time} • {detail.venue || 'TBD'} • {detail.status || '-'}
                </div>
                <div className="meta" style={{ marginTop: 4 }}>
                  Current inning: <strong style={{ color: '#dbe1ee' }}>{inningLabel}</strong>
                </div>
              </div>
              <div className="score" style={{ fontSize: 32 }}>
                {detail.awayScore ?? '-'} : {detail.homeScore ?? '-'}
              </div>
            </div>
          </div>

          <h3 style={{ margin: '16px 0 8px' }}>Scoreboard</h3>
          <BaseballScoreboard detail={detail} />

          <h3 style={{ margin: '20px 0 8px' }}>Event Timeline</h3>
          <BaseballEventTimeline events={detail.events} />

          <BaseballSummaryCompareCard gamePk={gamePk} />
        </>
      )}
    </div>
  )
}
