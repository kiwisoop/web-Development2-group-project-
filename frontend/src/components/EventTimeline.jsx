export default function EventTimeline({ events }) {
  if (!events || events.length === 0) return <p className="muted">No events recorded.</p>
  return (
    <ul className="timeline">
      {events.map(e => (
        <li key={e.id}>
          <span className="t">{e.eventTime}</span>
          <strong>{e.eventType}</strong> — {e.teamName} {e.playerName ? `(${e.playerName})` : ''}
          {e.description ? <div className="muted">{e.description}</div> : null}
        </li>
      ))}
    </ul>
  )
}
