import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMatches } from '../api/matches'
import MatchCard from '../components/MatchCard'

const SPORTS = [
  { key: 'SOCCER', label: 'Soccer', path: '/soccer' },
  { key: 'VOLLEYBALL', label: 'Volleyball', path: '/volleyball' },
  { key: 'BASKETBALL', label: 'Basketball', path: '/basketball' },
  { key: 'ESPORTS', label: 'Esports', path: '/esports' },
  { key: 'BASEBALL', label: 'Baseball (MLB)', path: '/baseball' },
]

export default function HomePage() {
  const [recent, setRecent] = useState([])
  useEffect(() => { fetchMatches().then(setRecent).catch(() => {}) }, [])

  return (
    <>
      <section className="hero">
        <h1>Sports Analysis & Summary</h1>
        <p>Match lists, stats, event timelines, AI-generated summaries and favorite team tracking — across four sports.</p>
      </section>

      <section>
        <h2>Sports</h2>
        <div className="grid cards-3">
          {SPORTS.map(s => (
            <Link key={s.key} to={s.path} className="card">
              <h3>{s.label}</h3>
              <p className="muted">View matches, stats, events and AI summaries.</p>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Recent matches</h2>
        {recent.length === 0 && <p className="muted">No recent matches.</p>}
        {recent.map(m => <MatchCard key={m.id} match={m} />)}
      </section>

      <section style={{ marginTop: 24 }} className="grid cards-3">
        <div className="card">
          <h3>AI Summary</h3>
          <p className="muted">A mock generator turns match info, stats and events into a readable summary. Pluggable for a real LLM later.</p>
        </div>
        <div className="card">
          <h3>Favorite Teams</h3>
          <p className="muted">Save teams you follow and quickly find their matches.</p>
        </div>
      </section>
    </>
  )
}
