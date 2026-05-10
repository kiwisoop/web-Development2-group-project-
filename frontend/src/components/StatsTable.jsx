export default function StatsTable({ stats }) {
  if (!stats || stats.length === 0) return <p className="muted">No stats available.</p>
  return (
    <table className="stats">
      <thead><tr><th>Team</th><th>Stat</th><th>Value</th></tr></thead>
      <tbody>
        {stats.map(s => (
          <tr key={s.id}><td>{s.teamName}</td><td>{s.statName}</td><td>{s.statValue}</td></tr>
        ))}
      </tbody>
    </table>
  )
}
