import { useState } from 'react';

const FORM_CLASS = { 승: 'form-win', 무: 'form-draw', 패: 'form-loss' };

// DB team 테이블에 division 컬럼이 없으므로(스키마 무변경) 팀명 기준 지구 매핑 상수를 사용한다.
// 실제 MLB 30개 구단의 지구 편제 — 순위/경기 mock 이 아니라 편제 메타데이터.
const MLB_DIVISION = {
  // AL East
  'Baltimore Orioles': 'AL_EAST',
  'Boston Red Sox': 'AL_EAST',
  'New York Yankees': 'AL_EAST',
  'Tampa Bay Rays': 'AL_EAST',
  'Toronto Blue Jays': 'AL_EAST',
  // AL Central
  'Chicago White Sox': 'AL_CENTRAL',
  'Cleveland Guardians': 'AL_CENTRAL',
  'Detroit Tigers': 'AL_CENTRAL',
  'Kansas City Royals': 'AL_CENTRAL',
  'Minnesota Twins': 'AL_CENTRAL',
  // AL West
  'Houston Astros': 'AL_WEST',
  'Los Angeles Angels': 'AL_WEST',
  'Athletics': 'AL_WEST',
  'Seattle Mariners': 'AL_WEST',
  'Texas Rangers': 'AL_WEST',
  // NL East
  'Atlanta Braves': 'NL_EAST',
  'Miami Marlins': 'NL_EAST',
  'New York Mets': 'NL_EAST',
  'Philadelphia Phillies': 'NL_EAST',
  'Washington Nationals': 'NL_EAST',
  // NL Central
  'Chicago Cubs': 'NL_CENTRAL',
  'Cincinnati Reds': 'NL_CENTRAL',
  'Milwaukee Brewers': 'NL_CENTRAL',
  'Pittsburgh Pirates': 'NL_CENTRAL',
  'St. Louis Cardinals': 'NL_CENTRAL',
  // NL West
  'Arizona Diamondbacks': 'NL_WEST',
  'Colorado Rockies': 'NL_WEST',
  'Los Angeles Dodgers': 'NL_WEST',
  'San Diego Padres': 'NL_WEST',
  'San Francisco Giants': 'NL_WEST',
};

const LEAGUE_LAYOUT = [
  {
    league: '아메리칸 리그',
    leagueKey: 'AL',
    divisions: [
      { key: 'AL_EAST', label: 'AL 동부', zone: 'EAST' },
      { key: 'AL_CENTRAL', label: 'AL 중부', zone: 'CENTRAL' },
      { key: 'AL_WEST', label: 'AL 서부', zone: 'WEST' },
    ],
  },
  {
    league: '내셔널 리그',
    leagueKey: 'NL',
    divisions: [
      { key: 'NL_EAST', label: 'NL 동부', zone: 'EAST' },
      { key: 'NL_CENTRAL', label: 'NL 중부', zone: 'CENTRAL' },
      { key: 'NL_WEST', label: 'NL 서부', zone: 'WEST' },
    ],
  },
];

// 3차 지구 필터 (단일 리그 선택 시에만 노출)
const ZONE_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'EAST', label: '동부' },
  { key: 'CENTRAL', label: '중부' },
  { key: 'WEST', label: '서부' },
];

// 지구 내 정렬: 승률 → 승 → 득실차 → 득점 → 팀명(오름차순)
function sortStandings(a, b) {
  if (b.winRate !== a.winRate) return b.winRate - a.winRate;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.scoreDifference !== a.scoreDifference) return b.scoreDifference - a.scoreDifference;
  if (b.scoresFor !== a.scoresFor) return b.scoresFor - a.scoresFor;
  return (a.teamName || '').localeCompare(b.teamName || '');
}

function TeamLogo({ name, logoUrl }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  if (logoUrl && !failed) {
    return (
      <img className="rank-team-logo" src={logoUrl} alt="" loading="lazy" onError={() => setFailed(true)} />
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

function DivisionTable({ label, teams }) {
  return (
    <div className="mlb-division">
      <h4 className="mlb-division-title">{label}</h4>
      <div className="ranking-table-wrap">
        <table className="ranking-table mlb-division-table">
          <thead>
            <tr>
              <th className="team-name-cell">팀</th>
              <th>경기 수</th>
              <th>승</th>
              <th>무</th>
              <th>패</th>
              <th>승률</th>
              <th>득점</th>
              <th>실점</th>
              <th>득실차</th>
              <th>최근 5경기</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={10} className="mlb-division-empty">표시할 팀이 없습니다.</td>
              </tr>
            ) : (
              teams.map((row) => {
                const diff = row.scoreDifference;
                const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
                const diffText = diff > 0 ? `+${diff}` : `${diff}`;
                return (
                  <tr key={row.teamId}>
                    <td className="team-name-cell">
                      <span className="rank-team">
                        <TeamLogo name={row.teamName} logoUrl={row.logoUrl} />
                        <span>{row.teamName}</span>
                      </span>
                    </td>
                    <td>{row.gamesPlayed}</td>
                    <td>{row.wins}</td>
                    <td>{row.draws}</td>
                    <td>{row.losses}</td>
                    <td>{row.winRate}%</td>
                    <td>{row.scoresFor}</td>
                    <td>{row.scoresAgainst}</td>
                    <td className={diffClass}>{diffText}</td>
                    <td><RecentForm form={row.recentForm} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * MLB 섹션형 순위표.
 * 전달받은 MLB 팀을 지구별로 그룹핑하여 아메리칸/내셔널 리그 × 동·중·서부 섹션으로 표시한다.
 * 순위 계산은 서버(DB FINAL 경기 기준)에서 온 값을 그대로 사용하고, 지구 내 정렬만 재적용한다.
 *
 * @param leagueFilter 'ALL' | 'AL' | 'NL'  (2차: 표시할 리그)
 * @param divisionFilter 'ALL' | 'EAST' | 'CENTRAL' | 'WEST'  (3차: 단일 리그 선택 시 지구)
 * @param onDivisionChange 3차 지구 필터 변경 콜백 (단일 리그 선택 시에만 노출)
 */
export default function MlbStandings({
  teams,
  leagueFilter = 'ALL',
  divisionFilter = 'ALL',
  onDivisionChange,
}) {
  const byDivision = {};
  teams.forEach((t) => {
    const div = MLB_DIVISION[t.teamName];
    if (!div) return;
    (byDivision[div] = byDivision[div] || []).push(t);
  });
  Object.values(byDivision).forEach((arr) => arr.sort(sortStandings));

  const shownLeagues = LEAGUE_LAYOUT.filter(
    (l) => leagueFilter === 'ALL' || l.leagueKey === leagueFilter,
  );
  const singleLeague = leagueFilter !== 'ALL';

  return (
    <div className="mlb-standings">
      {shownLeagues.map(({ league, divisions }) => {
        // 단일 리그 선택 시에만 3차 지구 필터 적용
        const shownDivisions = singleLeague
          ? divisions.filter((d) => divisionFilter === 'ALL' || d.zone === divisionFilter)
          : divisions;
        return (
          <section key={league} className="mlb-league">
            <h3 className="mlb-league-title">{league}</h3>

            {singleLeague && (
              <div className="ranking-league-filter mlb-zone-filter" role="group" aria-label={`${league} 지구 필터`}>
                {ZONE_FILTERS.map((z) => (
                  <button
                    key={z.key}
                    type="button"
                    className={`league-pill${divisionFilter === z.key ? ' league-pill--active' : ''}`}
                    onClick={() => onDivisionChange && onDivisionChange(z.key)}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            )}

            <div className="mlb-division-grid">
              {shownDivisions.map((d) => (
                <DivisionTable key={d.key} label={d.label} teams={byDivision[d.key] || []} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
