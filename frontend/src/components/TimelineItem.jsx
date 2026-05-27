export default function TimelineItem({ event }) {
  return (
    <div className="timeline-item">
      <span className="timeline-time">{event.eventTime || '-'}</span>
      <div className="timeline-body">
        <span className="timeline-type">{event.eventType || '-'}</span>
        {event.teamName && <span className="timeline-team">{event.teamName}</span>}
        {event.playerName && <span className="timeline-player">{event.playerName}</span>}
        {event.description && <span className="timeline-desc">{event.description}</span>}
      </div>
      {event.scoreAfterEvent && (
        <span className="timeline-score">{event.scoreAfterEvent}</span>
      )}
    </div>
  );
}
