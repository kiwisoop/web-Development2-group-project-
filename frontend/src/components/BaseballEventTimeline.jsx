export default function BaseballEventTimeline({ events }) {
  if (!events || events.length === 0) {
    return <p className="muted">No major events yet.</p>
  }
  const half = (h) => {
    if (!h) return ''
    return h.toLowerCase() === 'top' ? 'Top' : 'Bot'
  }
  return (
    <div>
      {events.map((e, i) => (
        <div key={i} className="match-row" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="teams">
              {half(e.halfInning)} {e.inning ?? '-'}
              {e.scoringPlay ? <span style={{ marginLeft: 8, color: '#ffb84a', fontSize: 12 }}>SCORING</span> : null}
            </div>
            <div className="meta" style={{ marginTop: 4, maxWidth: 720 }}>
              {e.description || '-'}
            </div>
          </div>
          <div className="score">
            {e.awayScore ?? '-'} : {e.homeScore ?? '-'}
          </div>
        </div>
      ))}
    </div>
  )
}
