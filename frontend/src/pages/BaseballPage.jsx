import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMatches } from '../api/matchApi';
import { getRankings } from '../api/rankingApi';
import TeamLogo from '../components/TeamLogo';

const INSIGHTS = [
  ['Pitch Zone', '투구 위치와 구종, 타자별 승부 흐름을 경기 상세에서 확인할 수 있습니다.'],
  ['Boxscore', '이닝별 득점, 안타, 실책과 선수 기록을 한눈에 살펴봅니다.'],
  ['AI Report', '경기 결과와 주요 장면을 짧은 리포트로 정리합니다.'],
];

const LEADERS = [
  ['ATL', '31승 18패', '.633', '+42'],
  ['LAD', '30승 20패', '.600', '+37'],
  ['NYY', '29승 21패', '.580', '+31'],
  ['SD', '28승 22패', '.560', '+18'],
];

function todayKey() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function extractList(response) {
  const data = response?.data?.data || response?.data || [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

function teamName(team) {
  return team?.teamName || team?.shortName || team?.name || '-';
}

function teamShort(team) {
  return team?.shortName || teamName(team).slice(0, 3).toUpperCase();
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function statusMeta(status) {
  if (status === 'LIVE' || status === 'IN_PROGRESS') return { label: 'LIVE', className: 'live' };
  if (status === 'FINAL') return { label: '종료', className: 'final' };
  return { label: '예정', className: 'preview' };
}

function formatRankingWinRate(value) {
  if (value === null || value === undefined) return '-';
  const rate = Number(value);
  if (Number.isNaN(rate)) return '-';
  const percent = rate > 1 ? rate : rate * 100;
  return `${percent.toFixed(1)}%`;
}

function BaseballTeamLine({ team, score, leading }) {
  return (
    <div className={`baseball-team-line${leading ? ' is-leading' : ''}`}>
      <span>
        <TeamLogo team={team} size={34} radius={9} />
        <b>{teamName(team)}</b>
      </span>
      <strong>{score ?? '-'}</strong>
    </div>
  );
}

export default function BaseballPage() {
  const [todayMatches, setTodayMatches] = useState([]);
  const [rankings, setRankings] = useState([]);
  const selectedDate = todayKey();

  useEffect(() => {
    const controller = new AbortController();

    getMatches({ sportType: 'BASEBALL', date: selectedDate, sort: 'oldest', size: 20 }, controller.signal)
      .then((res) => setTodayMatches(extractList(res).slice(0, 8)))
      .catch(() => setTodayMatches([]));

    getRankings('BASEBALL', undefined, controller.signal)
      .then((res) => setRankings(extractList(res).slice(0, 5)))
      .catch(() => setRankings([]));

    return () => controller.abort();
  }, [selectedDate]);

  const featuredMatches = useMemo(() => todayMatches, [todayMatches]);

  return (
    <div className="baseball-page">
      <section className="baseball-hero">
        <div className="baseball-hero-media" aria-hidden="true" />
        <div className="baseball-hero-copy">
          <span className="baseball-kicker">MLB Data Center</span>
          <h1>오늘의 MLB 흐름을 한눈에</h1>
          <p>
            오늘 예정된 MLB 경기와 팀 순위를 먼저 보여주고, 경기 상세에서 라인스코어와 투구 기록,
            AI 리포트까지 자연스럽게 이어집니다.
          </p>
          <div className="baseball-hero-metrics">
            <span><b>{todayMatches.length}</b> 오늘 경기</span>
          </div>
          <div className="baseball-hero-actions">
            <Link to={`/matches?sportType=BASEBALL&date=${selectedDate}`} className="btn btn-primary btn-lg">
              오늘 MLB 경기 보기
            </Link>
            <Link to="/analysis?sportType=BASEBALL" className="btn btn-outline btn-lg">
              경기 리포트 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="baseball-toolbar" aria-label="야구 빠른 이동">
        <Link to={`/matches?sportType=BASEBALL&date=${selectedDate}`}>오늘 경기</Link>
        <Link to={`/matches?sportType=BASEBALL&status=SCHEDULED&date=${selectedDate}`}>예정 경기</Link>
        <Link to="/rankings/baseball">팀 순위</Link>
        <Link to="/analysis?sportType=BASEBALL">경기 리포트</Link>
      </section>

      <section className="baseball-grid">
        <div className="baseball-main-column">
          <div className="baseball-section-head">
            <div>
              <span className="baseball-kicker">Featured Games</span>
              <h2>오늘의 MLB 경기</h2>
            </div>
            <Link to={`/matches?sportType=BASEBALL&date=${selectedDate}`} className="btn btn-outline btn-sm">
              전체 보기
            </Link>
          </div>

          <div className="baseball-game-list">
            {featuredMatches.slice(0, 6).map((game) => {
              const hasScore = game.homeScore !== null && game.homeScore !== undefined
                && game.awayScore !== null && game.awayScore !== undefined;
              const homeWin = hasScore && Number(game.homeScore) > Number(game.awayScore);
              const awayWin = hasScore && Number(game.awayScore) > Number(game.homeScore);
              const meta = statusMeta(game.status);
              return (
                <Link key={game.id || `${teamName(game.awayTeam)}-${teamName(game.homeTeam)}`} to={`/matches/${game.id}`} className="baseball-game-card">
                  <div className="baseball-game-meta">
                    <span className={`baseball-status baseball-status--${meta.className}`}>
                      {meta.label}
                    </span>
                    <span>{formatTime(game.matchDate)}</span>
                  </div>
                  <BaseballTeamLine team={game.awayTeam} score={game.awayScore} leading={awayWin} />
                  <BaseballTeamLine team={game.homeTeam} score={game.homeScore} leading={homeWin} />
                  <p>{game.venue || game.league?.leagueName || '경기 상세에서 더 많은 기록을 확인하세요.'}</p>
                </Link>
              );
            })}
            {featuredMatches.length === 0 && (
              <div className="baseball-empty-card">
                <strong>오늘 등록된 MLB 경기가 없습니다.</strong>
                <span>다른 날짜의 일정은 경기센터에서 확인할 수 있습니다.</span>
              </div>
            )}
          </div>
        </div>

        <aside className="baseball-side-panel">
          <div className="baseball-section-head">
            <div>
              <span className="baseball-kicker">Standings</span>
              <h2>팀 순위</h2>
            </div>
            <Link to="/rankings/baseball" className="btn btn-outline btn-sm">전체 보기</Link>
          </div>
          <div className="baseball-ranking-table">
            {(rankings.length > 0 ? rankings : LEADERS).map((row, index) => {
              const fallback = Array.isArray(row);
              const team = fallback ? row[0] : (row.teamName || row.shortName || row.name);
              const record = fallback ? row[1] : `${row.wins ?? '-'}승 ${row.losses ?? '-'}패`;
              const pct = fallback ? row[2] : formatRankingWinRate(row.winRate);
              const diffSource = row.scoreDifference ?? row.goalDiff ?? row.streak;
              const diff = fallback ? row[3] : (diffSource === null || diffSource === undefined ? '-' : diffSource);
              return (
                <div key={`${team}-${index}`} className="baseball-ranking-row">
                  <span>{index + 1}</span>
                  <TeamLogo team={fallback ? { shortName: team, teamName: team } : row} size={28} radius={8} />
                  <strong>{teamShort(fallback ? { shortName: team } : row)}</strong>
                  <em>{record}</em>
                  <b>{pct}</b>
                  <small>{diff}</small>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="baseball-insights">
        {INSIGHTS.map(([title, description]) => (
          <article key={title} className="baseball-insight-card">
            <span>{title}</span>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
