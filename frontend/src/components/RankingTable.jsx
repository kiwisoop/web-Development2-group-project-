export default function RankingTable({ rankings, sportType }) {
  if (!rankings || rankings.length === 0) {
    return <p className="empty-text">등록된 팀 데이터가 없습니다.</p>;
  }

  const isSoccer = sportType === 'SOCCER';

  return (
    <div className="ranking-table-wrap">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>순위</th>
            <th className="team-name-cell">팀명</th>
            <th>경기 수</th>
            <th>승</th>
            <th>무</th>
            <th>패</th>
            <th>승률</th>
            <th>득점</th>
            <th>실점</th>
            <th>득실차</th>
            <th>승점</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((row) => {
            const diff = row.scoreDifference;
            const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
            const diffText = diff > 0 ? `+${diff}` : `${diff}`;
            return (
              <tr key={row.teamId}>
                <td><span className="rank-badge">{row.rank}</span></td>
                <td className="team-name-cell">{row.teamName}</td>
                <td>{row.gamesPlayed}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.winRate}%</td>
                <td>{row.scoresFor}</td>
                <td>{row.scoresAgainst}</td>
                <td className={diffClass}>{diffText}</td>
                <td>{isSoccer ? <strong>{row.points}</strong> : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
