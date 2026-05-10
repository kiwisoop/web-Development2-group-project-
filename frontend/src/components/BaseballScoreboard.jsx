// Inning-by-inning scoreboard with R/H/E summary on the right.
export default function BaseballScoreboard({ detail }) {
  if (!detail) return null
  const innings = detail.innings || []
  const maxInning = Math.max(9, ...innings.map(i => i.inning || 0))
  const cols = []
  for (let n = 1; n <= maxInning; n++) cols.push(n)

  const cell = (v) => (v === null || v === undefined ? '-' : v)
  const findInning = (n) => innings.find(i => i.inning === n)

  const thStyle = { padding: '6px 10px', borderBottom: '1px solid #232833', textAlign: 'center', color: '#8a93a3', fontWeight: 600, fontSize: 13 }
  const tdStyle = { padding: '6px 10px', borderBottom: '1px solid #1c2029', textAlign: 'center' }
  const teamStyle = { ...tdStyle, textAlign: 'left', fontWeight: 600 }
  const rheStyle = { ...tdStyle, fontWeight: 700, background: '#1a1f29' }

  return (
    <div className="card" style={{ padding: 12, overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: 'left' }}>Team</th>
            {cols.map(n => <th key={n} style={thStyle}>{n}</th>)}
            <th style={thStyle}>R</th>
            <th style={thStyle}>H</th>
            <th style={thStyle}>E</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={teamStyle}>{detail.awayTeam || 'Away'}</td>
            {cols.map(n => <td key={n} style={tdStyle}>{cell(findInning(n)?.awayRuns)}</td>)}
            <td style={rheStyle}>{cell(detail.awayScore)}</td>
            <td style={rheStyle}>{cell(detail.awayHits)}</td>
            <td style={rheStyle}>{cell(detail.awayErrors)}</td>
          </tr>
          <tr>
            <td style={teamStyle}>{detail.homeTeam || 'Home'}</td>
            {cols.map(n => <td key={n} style={tdStyle}>{cell(findInning(n)?.homeRuns)}</td>)}
            <td style={rheStyle}>{cell(detail.homeScore)}</td>
            <td style={rheStyle}>{cell(detail.homeHits)}</td>
            <td style={rheStyle}>{cell(detail.homeErrors)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
