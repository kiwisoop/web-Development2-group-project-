export default function MlbLineupTable({ lineup, title }) {
  if (!lineup || lineup.length === 0) return null;
  const batters = lineup.filter(p => p.battingOrder > 0);
  if (batters.length === 0) return null;

  return (
    <div className="mlb-lineup-wrap">
      <h4 className="mlb-section-subtitle">{title}</h4>
      <table className="mlb-lineup-table">
        <thead>
          <tr>
            <th>타순</th>
            <th className="mlb-lineup-name-col">선수</th>
            <th>POS</th>
            <th>#</th>
          </tr>
        </thead>
        <tbody>
          {batters.map((player, i) => (
            <tr key={i}>
              <td className="mlb-lineup-order">{player.battingOrder}</td>
              <td className="mlb-lineup-name">{player.fullName}</td>
              <td className="mlb-lineup-pos">{player.position}</td>
              <td className="mlb-lineup-jersey">{player.jerseyNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
