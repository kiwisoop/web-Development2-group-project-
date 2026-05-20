export default function StatCard({ stat }) {
  return (
    <div className="stat-card card">
      <p className="stat-team">{stat.teamName || '-'}</p>
      <p className="stat-name">{stat.statName || '-'}</p>
      <p className="stat-value">{stat.statValue || '-'}</p>
    </div>
  );
}
