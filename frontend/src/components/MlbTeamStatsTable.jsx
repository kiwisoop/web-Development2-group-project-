import { useMemo, useState } from 'react'

function TeamLogo({ teamId, teamName }) {
  const [failed, setFailed] = useState(false)
  if (!teamId || failed) return null
  return (
    <img
      className="team-logo"
      src={`https://www.mlbstatic.com/team-logos/${teamId}.svg`}
      alt={teamName || ''}
      onError={() => setFailed(true)}
    />
  )
}

// Compares values that can be numbers or numeric strings (e.g. ".278").
function compareVals(a, b) {
  const an = a == null ? null : (typeof a === 'number' ? a : parseFloat(a))
  const bn = b == null ? null : (typeof b === 'number' ? b : parseFloat(b))
  const aValid = an != null && !Number.isNaN(an)
  const bValid = bn != null && !Number.isNaN(bn)
  if (!aValid && !bValid) return 0
  if (!aValid) return 1
  if (!bValid) return -1
  return an - bn
}

function formatVal(v, key) {
  if (v == null || v === '') return '-'
  // MLB returns rate stats as strings already (".278", "1.234"); leave them alone.
  if (typeof v === 'string') return v
  if (typeof v === 'number') {
    // Counting stats remain integers; rate keys in case the API returns numbers.
    const rateKeys = ['avg', 'obp', 'slg', 'ops', 'era', 'whip', 'fieldingPercentage', 'inningsPitched']
    if (rateKeys.includes(key)) return v.toFixed(3)
    return Number.isInteger(v) ? String(v) : v.toFixed(3)
  }
  return String(v)
}

export default function MlbTeamStatsTable({ rows, columns, highlightCols = [] }) {
  // columns: [{ key, label, defaultDesc?: boolean }]
  const [sortKey, setSortKey] = useState(null)
  const [sortDesc, setSortDesc] = useState(true)

  const sorted = useMemo(() => {
    if (!rows) return []
    if (!sortKey) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      // "rank" sorts on rank, "team" sorts on name, otherwise on stats[key]
      let av, bv
      if (sortKey === 'rank') { av = a.rank; bv = b.rank }
      else if (sortKey === 'team') { av = a.teamName; bv = b.teamName }
      else { av = a.stats?.[sortKey]; bv = b.stats?.[sortKey] }
      let c
      if (sortKey === 'team') {
        c = String(av || '').localeCompare(String(bv || ''))
      } else {
        c = compareVals(av, bv)
      }
      return sortDesc ? -c : c
    })
    return copy
  }, [rows, sortKey, sortDesc])

  const onSort = (col) => {
    if (sortKey !== col.key) {
      setSortKey(col.key)
      setSortDesc(col.defaultDesc !== false)
    } else {
      setSortDesc(d => !d)
    }
  }

  if (!rows || rows.length === 0) {
    return <div className="notice">No data available.</div>
  }

  const indicator = (key) =>
    sortKey === key ? <span className="sort-indicator">{sortDesc ? '▼' : '▲'}</span> : null

  return (
    <div className="team-stats-scroll">
      <table className="team-stats-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => onSort({ key: 'rank', defaultDesc: false })}>
              # {indicator('rank')}
            </th>
            <th className="sortable" onClick={() => onSort({ key: 'team', defaultDesc: false })}>
              Team {indicator('team')}
            </th>
            {columns.map(col => (
              <th
                key={col.key}
                className="sortable"
                onClick={() => onSort(col)}
                title={col.label}
              >
                {col.label} {indicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={`${row.teamId ?? row.teamName ?? i}`}>
              <td>{row.rank ?? i + 1}</td>
              <td>
                <span className="team-cell">
                  <TeamLogo teamId={row.teamId} teamName={row.teamName} />
                  <span>{row.teamName || '-'}</span>
                </span>
              </td>
              {columns.map(col => (
                <td
                  key={col.key}
                  className={highlightCols.includes(col.key) ? 'highlight' : ''}
                >
                  {formatVal(row.stats?.[col.key], col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
