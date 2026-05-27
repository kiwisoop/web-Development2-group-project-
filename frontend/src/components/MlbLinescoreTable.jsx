export default function MlbLinescoreTable({ linescore, homeShortName, awayShortName }) {
  if (!linescore || !linescore.innings) return null;
  const { innings, homeRuns, homeHits, homeErrors, awayRuns, awayHits, awayErrors } = linescore;

  return (
    <div className="mlb-linescore-wrap">
      <table className="mlb-linescore-table">
        <thead>
          <tr>
            <th className="mlb-ls-team-col">팀</th>
            {innings.map(inn => (
              <th key={inn.inningNumber} className="mlb-ls-inning-col">{inn.inningNumber}</th>
            ))}
            <th className="mlb-ls-stat-col">R</th>
            <th className="mlb-ls-stat-col">H</th>
            <th className="mlb-ls-stat-col">E</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="mlb-ls-team-name">{awayShortName || '원정'}</td>
            {innings.map(inn => (
              <td key={inn.inningNumber} className="mlb-ls-score">{inn.awayRuns}</td>
            ))}
            <td className="mlb-ls-total">{awayRuns}</td>
            <td className="mlb-ls-total">{awayHits}</td>
            <td className="mlb-ls-total">{awayErrors}</td>
          </tr>
          <tr>
            <td className="mlb-ls-team-name">{homeShortName || '홈'}</td>
            {innings.map(inn => (
              <td key={inn.inningNumber} className="mlb-ls-score">{inn.homeRuns}</td>
            ))}
            <td className="mlb-ls-total">{homeRuns}</td>
            <td className="mlb-ls-total">{homeHits}</td>
            <td className="mlb-ls-total">{homeErrors}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
