const BATTER_COLS = [
  { key: 'atBats', label: 'AB' },
  { key: 'runs', label: 'R' },
  { key: 'hits', label: 'H' },
  { key: 'rbi', label: 'RBI' },
  { key: 'baseOnBalls', label: 'BB' },
  { key: 'strikeOuts', label: 'K' },
  { key: 'homeRuns', label: 'HR' },
  { key: 'doubles', label: '2B' },
  { key: 'triples', label: '3B' },
];

const PITCHER_COLS = [
  { key: 'inningsPitched', label: 'IP' },
  { key: 'hits', label: 'H' },
  { key: 'runs', label: 'R' },
  { key: 'earnedRuns', label: 'ER' },
  { key: 'baseOnBalls', label: 'BB' },
  { key: 'strikeOuts', label: 'K' },
  { key: 'numberOfPitches', label: 'P' },
  { key: 'era', label: 'ERA' },
];

function BatterTable({ batters, teamName }) {
  if (!batters || batters.length === 0) return null;
  return (
    <div className="mlb-boxscore-wrap">
      <h4 className="mlb-section-subtitle">{teamName} 타선</h4>
      <div className="mlb-table-scroll">
        <table className="mlb-boxscore-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="mlb-bs-name-col">선수</th>
              <th>POS</th>
              {BATTER_COLS.map(c => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {batters.map((p, i) => (
              <tr key={i}>
                <td className="mlb-bs-order">{p.battingOrder > 0 ? p.battingOrder : '-'}</td>
                <td className="mlb-bs-name">{p.fullName}</td>
                <td className="mlb-bs-pos">{p.position}</td>
                {BATTER_COLS.map(c => <td key={c.key}>{p[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PitcherTable({ pitchers, teamName }) {
  if (!pitchers || pitchers.length === 0) return null;
  return (
    <div className="mlb-boxscore-wrap">
      <h4 className="mlb-section-subtitle">{teamName} 투수진</h4>
      <div className="mlb-table-scroll">
        <table className="mlb-boxscore-table">
          <thead>
            <tr>
              <th className="mlb-bs-name-col">선수</th>
              {PITCHER_COLS.map(c => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {pitchers.map((p, i) => (
              <tr key={i}>
                <td className="mlb-bs-name">{p.fullName}</td>
                {PITCHER_COLS.map(c => <td key={c.key}>{p[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MlbBoxscoreTable({ homeBatters, awayBatters, homePitchers, awayPitchers, homeTeamName, awayTeamName }) {
  return (
    <div className="mlb-boxscore-section">
      <BatterTable batters={awayBatters} teamName={awayTeamName} />
      <BatterTable batters={homeBatters} teamName={homeTeamName} />
      <PitcherTable pitchers={awayPitchers} teamName={awayTeamName} />
      <PitcherTable pitchers={homePitchers} teamName={homeTeamName} />
    </div>
  );
}
