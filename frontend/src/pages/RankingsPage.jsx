import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRankings } from '../api/rankingApi';
import { getCitoSeasons, getCitoStandings } from '../api/lckApi';
import RankingTable from '../components/RankingTable';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';

const SPORT_TABS = [
  { key: 'soccer',   label: '축구',    apiKey: 'SOCCER' },
  { key: 'baseball', label: '야구',    apiKey: 'BASEBALL' },
  { key: 'esports',  label: 'e스포츠', apiKey: 'ESPORTS' },
];

// ─── 팀 로고 ──────────────────────────────────────────────────────────────────
function TeamLogo({ url, name, size = 22 }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <span className="lck-rank-logo-fb" style={{ width: size, height: size, fontSize: size * 0.42 }}>
        {(name || '?').slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img src={url} alt={name} width={size} height={size}
      className="esports-team-logo" onError={() => setErr(true)} />
  );
}

// ─── LCK 순위표 ───────────────────────────────────────────────────────────────
function LckStandingsTable({ standings }) {
  if (!standings || standings.length === 0) {
    return <p className="empty-text">순위 데이터가 없습니다.</p>;
  }
  return (
    <div className="ranking-table-wrap">
      <table className="ranking-table lck-rank-table">
        <thead>
          <tr>
            <th>순위</th>
            <th className="team-name-cell">팀</th>
            <th>승</th>
            <th>패</th>
            <th>승률</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const winRate = row.winRate != null
              ? `${(row.winRate * 100).toFixed(0)}%`
              : row.wins != null && row.losses != null
                ? `${Math.round(row.wins / Math.max(row.wins + row.losses, 1) * 100)}%`
                : '-';
            return (
              <tr key={i} className={row.rank === 1 ? 'lck-rank-top-row' : ''}>
                <td>
                  <span className="rank-badge">{row.rank ?? i + 1}</span>
                </td>
                <td className="team-name-cell lck-rank-team-cell">
                  <TeamLogo url={row.logoUrl} name={row.teamName} size={22} />
                  <span className="lck-rank-team-name">{row.teamName}</span>
                  {row.orgSlug && (
                    <span className="lck-rank-team-code">{row.orgSlug.toUpperCase()}</span>
                  )}
                </td>
                <td className="esports-rank-wins">{row.wins ?? '-'}</td>
                <td className="esports-rank-losses">{row.losses ?? '-'}</td>
                <td>{winRate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── e스포츠 탭 (Cito API 기반) ───────────────────────────────────────────────
function EsportsRankingsView() {
  const [seasons, setSeasons]           = useState([]);
  const [selectedSeason, setSelected]   = useState(null);
  const [standings, setStandings]       = useState([]);
  const [loadingSeasons, setLS]         = useState(true);
  const [loadingStandings, setLSt]      = useState(false);
  const [error, setError]               = useState(null);

  // 시즌 목록 로드
  useEffect(() => {
    const ctrl = new AbortController();
    getCitoSeasons(ctrl.signal)
      .then((res) => {
        const list = res.data || [];
        setSeasons(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => setError('시즌 데이터를 불러오지 못했습니다.'))
      .finally(() => setLS(false));
    return () => ctrl.abort();
  }, []);

  // 선택 시즌 변경 시 순위 로드
  useEffect(() => {
    if (!selectedSeason) return;
    const ctrl = new AbortController();
    setLSt(true);
    setError(null);
    setStandings([]);
    getCitoStandings(selectedSeason.id, ctrl.signal)
      .then((res) => setStandings(res?.data || []))
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setError('순위 데이터를 불러오지 못했습니다.');
      })
      .finally(() => setLSt(false));
    return () => ctrl.abort();
  }, [selectedSeason]);

  if (loadingSeasons) return <LoadingState />;

  return (
    <div className="lck-rankings-view">
      {/* 시즌 탭 */}
      <div className="esports-season-tabs lck-rank-season-tabs">
        {seasons.map((s) => (
          <button
            key={s.id}
            className={`btn${selectedSeason?.id === s.id ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => setSelected(s)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {error && <ErrorBox message={error} />}

      {loadingStandings ? (
        <LoadingState />
      ) : (
        <div className="lck-rank-container">
          <div className="lck-rank-header-bar">
            <span className="lck-rank-season-label">
              {selectedSeason?.name} 순위표
            </span>
            <span className="lck-rank-source-tag">Cito API</span>
          </div>
          <LckStandingsTable standings={standings} />
        </div>
      )}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function RankingsPage() {
  const { sportType } = useParams();
  const navigate = useNavigate();

  const current = SPORT_TABS.find((t) => t.key === sportType) || SPORT_TABS[0];

  const [rankings, setRankings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (current.key === 'esports') {
      setLoading(false);
      return;
    }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getRankings(current.apiKey, controller.signal)
      .then((res) => setRankings(res.data.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('랭킹을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [current.apiKey, current.key]);

  }, [current.apiKey]);

  return (
    <div className="rankings-page">
      <h1 className="page-title">팀 순위</h1>
      <div className="ranking-tabs">
        {SPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`btn${current.key === tab.key ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => navigate(`/rankings/${tab.key}`)}
          >
            {tab.label}
          </button>
        ))}
      </div>


      {current.key === 'esports' ? (
        <EsportsRankingsView />
      ) : (
        <>
          {loading && <LoadingState />}
          {error && <ErrorBox message={error} />}
          {!loading && !error && (
            <RankingTable rankings={rankings} sportType={current.apiKey} />
          )}
        </>
      )}
     
    </div>
      
  );
}
