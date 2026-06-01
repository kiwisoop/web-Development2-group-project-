import TeamLogo from './TeamLogo';

function valueOrDash(value) {
  return value === null || value === undefined ? '-' : value;
}

function formatWinRate(value) {
  if (value === null || value === undefined) return '-';
  const rate = Number(value);
  if (Number.isNaN(rate)) return '-';
  return `${rate > 1 ? rate.toFixed(1) : (rate * 100).toFixed(1)}%`;
}

export default function RankingTable({ rankings, sportType }) {
  if (!rankings || rankings.length === 0) {
    return <p className="empty-text">등록된 순위 데이터가 없습니다.</p>;
  }

  const isSoccer = sportType === 'SOCCER';

  return (
    <div className="ranking-table-wrap">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>순위</th>
            <th className="team-name-cell">팀</th>
            <th>경기</th>
            <th>승</th>
            {isSoccer && <th>무</th>}
            <th>패</th>
            <th>승률</th>
            <th>득점</th>
            <th>실점</th>
            <th>득실차</th>
            {isSoccer && <th>승점</th>}
          </tr>
        </thead>
        <tbody>
          {rankings.map((row, index) => {
            const diff = Number(row.scoreDifference ?? row.goalDifference ?? 0);
            const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
            const diffText = diff > 0 ? `+${diff}` : `${diff}`;
            const rank = row.rank || index + 1;

            return (
              <tr key={row.teamId || row.id || `${row.teamName}-${index}`}>
                <td><span className="rank-badge">{rank}</span></td>
                <td className="team-name-cell">
                  <div className="ranking-team-cell">
                    <TeamLogo team={row} size={32} radius={8} />
                    <div>
                      <strong>{row.teamName || row.name || row.shortName || '-'}</strong>
                      {(row.shortName || row.leagueName) && (
                        <span>{[row.shortName, row.leagueName].filter(Boolean).join(' · ')}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>{valueOrDash(row.gamesPlayed)}</td>
                <td>{valueOrDash(row.wins)}</td>
                {isSoccer && <td>{valueOrDash(row.draws)}</td>}
                <td>{valueOrDash(row.losses)}</td>
                <td>{formatWinRate(row.winRate)}</td>
                <td>{valueOrDash(row.scoresFor)}</td>
                <td>{valueOrDash(row.scoresAgainst)}</td>
                <td className={diffClass}>{diffText}</td>
                {isSoccer && <td><strong>{valueOrDash(row.points)}</strong></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
