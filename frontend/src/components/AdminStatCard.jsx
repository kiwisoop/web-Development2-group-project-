export default function AdminStatCard({ label, value, description }) {
  return (
    <div className="stat-card card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {description && <p className="stat-description">{description}</p>}
    </div>
  );
}
