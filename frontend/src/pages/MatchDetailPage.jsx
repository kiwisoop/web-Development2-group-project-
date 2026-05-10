import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchMatch, fetchStats, fetchEvents } from '../api/matches'
import { fetchAnalysis, generateAnalysis } from '../api/analysis'
import { addFavorite } from '../api/favorites'
import { getUser } from '../api/auth'
import StatsTable from '../components/StatsTable'
import EventTimeline from '../components/EventTimeline'
import AISummaryCard from '../components/AISummaryCard'

export default function MatchDetailPage() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [stats, setStats] = useState([])
  const [events, setEvents] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [genLoading, setGenLoading] = useState(false)
  const [favMsg, setFavMsg] = useState('')

  useEffect(() => {
    fetchMatch(id).then(setMatch).catch(() => {})
    fetchStats(id).then(setStats).catch(() => {})
    fetchEvents(id).then(setEvents).catch(() => {})
    fetchAnalysis(id).then(d => { if (d) setAnalysis(d) }).catch(() => {})
  }, [id])

  const onGenerate = async () => {
    setGenLoading(true)
    try { setAnalysis(await generateAnalysis(id)) }
    finally { setGenLoading(false) }
  }

  const onFavorite = async (teamName) => {
    const user = getUser()
    if (!user) { setFavMsg('Login first to save favorites.'); return }
    await addFavorite({ userId: user.id, sportType: match.sportType, teamName })
    setFavMsg(`Saved ${teamName} to favorites.`)
  }

  if (!match) return <p className="muted">Loading match...</p>

  const date = match.matchDate ? new Date(match.matchDate).toLocaleString() : ''

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ margin: 0 }}>{match.homeTeam} vs {match.awayTeam}</h2>
        <p className="muted">{match.leagueName} • {date} • {match.venue} • {match.status}</p>
        <p className="score">{match.homeScore} : {match.awayScore}</p>
        <p>{match.basicSummary}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => onFavorite(match.homeTeam)}>★ {match.homeTeam}</button>
          <button className="btn" onClick={() => onFavorite(match.awayTeam)}>★ {match.awayTeam}</button>
        </div>
        {favMsg && <p className="muted" style={{ marginTop: 8 }}>{favMsg}</p>}
      </div>

      <div className="card">
        <h3>Stats</h3>
        <StatsTable stats={stats} />
      </div>

      <div className="card">
        <h3>Event Timeline</h3>
        <EventTimeline events={events} />
      </div>

      <AISummaryCard analysis={analysis} onGenerate={onGenerate} loading={genLoading} />
    </div>
  )
}
