import { useState } from 'react';

const FORM_CLASS = { 승: 'form-win', 무: 'form-draw', 패: 'form-loss' };

// 팀 로고. logoUrl 이 있으면 이미지를, 없거나 로드 실패 시 팀명 첫 글자 폴백.
function TeamLogo({ name, logoUrl }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  if (logoUrl && !failed) {
    return (
      <img
        className="rank-team-logo"
        src={logoUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return <span className="rank-team-logo rank-team-logo--fallback" aria-hidden="true">{initial}</span>;
}

function RecentForm({ form }) {
  if (!form || form.length === 0) {
    return <span className="rank-form-empty">데이터 부족</span>;
  }
  return (
    <span className="rank-form">
      {form.map((r, i) => (
        <span key={i} className={`form-badge ${FORM_CLASS[r] || ''}`}>{r}</span>
      ))}
    </span>
  );
}

export default function RankingTable({ rankings, sportType }) {
  if (!rankings || rankings.length === 0) {
    return <p className="empty-text">등록된 팀 데이터가 없습니다.</p>;
  }

  const isSoccer = sportType === 'SOCCER';
  const isBaseball = sportType === 'BASEBALL';

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
            {isBaseball ? <th>최근 5경기</th> : <th>승점</th>}
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
                <td className="team-name-cell">
                  {isBaseball ? (
                    <span className="rank-team">
                      <TeamLogo name={row.teamName} logoUrl={row.logoUrl} />
                      <span>{row.teamName}</span>
                    </span>
                  ) : (
                    row.teamName
                  )}
                </td>
                <td>{row.gamesPlayed}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.winRate}%</td>
                <td>{row.scoresFor}</td>
                <td>{row.scoresAgainst}</td>
                <td className={diffClass}>{diffText}</td>
                {isBaseball ? (
                  <td><RecentForm form={row.recentForm} /></td>
                ) : (
                  <td>{isSoccer ? <strong>{row.points}</strong> : '-'}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
