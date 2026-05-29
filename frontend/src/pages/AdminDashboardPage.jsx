import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard, syncEsportsSchedule, syncSoccerFixtures } from '../api/adminApi';
import { syncMlbSchedule } from '../api/mlbApi';
import AdminStatCard from '../components/AdminStatCard';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';

const SPORT_LABELS = { SOCCER: '축구', BASEBALL: '야구', ESPORTS: 'e스포츠' };
const STATUS_LABELS = {
  NOT_CREATED: '미생성',
  GENERATING: '생성 중',
  DONE: '완료',
  FAILED: '실패',
};

const SYNC_CONFIG = {
  SOCCER: {
    name: '축구',
    source: 'K리그 DB',
    description: '팀원이 만든 축구 원본 DB를 공통 경기 테이블로 복사해 경기센터와 분석 탭에서 같이 보이게 합니다.',
    action: syncSoccerFixtures,
    path: '/matches?sportType=SOCCER',
    button: '축구 데이터 동기화',
  },
  BASEBALL: {
    name: '야구',
    source: 'MLB Stats API',
    description: 'MLB Stats API에서 경기 일정을 가져와 공통 경기 테이블과 팀 데이터를 업데이트합니다.',
    action: syncMlbSchedule,
    path: '/matches?sportType=BASEBALL',
    button: 'MLB 일정 가져오기',
  },
  ESPORTS: {
    name: 'e스포츠',
    source: 'Cito LCK API',
    description: 'Cito LCK 일정을 공통 경기 테이블로 저장해 분석 가능한 경기 목록에 포함시킵니다.',
    action: syncEsportsSchedule,
    path: '/matches?sportType=ESPORTS',
    button: 'e스포츠 일정 동기화',
  },
};

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ko-KR');
}

function StatusPill({ children }) {
  return <span className="admin-status-pill">{children}</span>;
}

function BarChart({ items, total }) {
  if (!items.length) return <p className="empty-text">표시할 데이터가 없습니다.</p>;

  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="admin-chart">
      {items.map((item) => {
        const width = Math.max(6, Math.round((item.value / max) * 100));
        const percent = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <div className="admin-bar-row" key={item.label}>
            <div className="admin-bar-meta">
              <span>{item.label}</span>
              <strong>{item.value.toLocaleString()}건 {total ? `· ${percent}%` : ''}</strong>
            </div>
            <div className="admin-bar-track">
              <span className="admin-bar-fill" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SyncSummary({ state }) {
  if (!state?.result && !state?.error) return null;
  if (state.error) return <ErrorBox message={state.error} />;

  const result = state.result;
  return (
    <div className="admin-sync-mini">
      <span>가져옴 {result.fetchedGames ?? 0}</span>
      <span>신규 {result.createdMatches ?? 0}</span>
      <span>업데이트 {result.updatedMatches ?? 0}</span>
      <span>팀 {result.createdTeams ?? 0}</span>
      <span>제외 {result.skippedGames ?? 0}</span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStartDate, setSyncStartDate] = useState('2024-04-01');
  const [syncEndDate, setSyncEndDate] = useState('2024-04-07');
  const [syncState, setSyncState] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getAdminDashboard(controller.signal)
      .then((res) => setData(res.data.data))
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setError('대시보드를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleSync = async (sportType) => {
    const config = SYNC_CONFIG[sportType];
    setSyncState((prev) => ({
      ...prev,
      [sportType]: { loading: true, result: null, error: null },
    }));

    try {
      const res = await config.action(syncStartDate, syncEndDate);
      setSyncState((prev) => ({
        ...prev,
        [sportType]: { loading: false, result: res.data.data, error: null },
      }));

      const refreshed = await getAdminDashboard();
      setData(refreshed.data.data);
    } catch (err) {
      setSyncState((prev) => ({
        ...prev,
        [sportType]: {
          loading: false,
          result: null,
          error: err.response?.data?.message || `${config.name} 동기화에 실패했습니다.`,
        },
      }));
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const sportCounts = Object.fromEntries(
    (data.matchCountBySportType || []).map((item) => [item.sportType, item.count]),
  );
  const sportChartItems = Object.keys(SYNC_CONFIG).map((key) => ({
    label: SPORT_LABELS[key],
    value: sportCounts[key] || 0,
  }));
  const analysisChartItems = (data.analysisCountByStatus || []).map((item) => ({
    label: STATUS_LABELS[item.status] || item.status,
    value: item.count,
  }));
  const activityItems = [
    { label: '가입 사용자', value: data.totalUsers || 0 },
    { label: '관심 팀 등록', value: data.totalFavoriteTeams || 0 },
    { label: '승부 예측 참여', value: data.totalPredictionVotes || 0 },
  ];

  return (
    <div className="admin-page">
      <section className="admin-hero card">
        <div>
          <span className="section-kicker">Admin Console</span>
          <h1 className="page-title">운영 대시보드</h1>
          <p className="page-desc">
            경기 데이터, AI 분석 상태, 사용자 활동을 한 화면에서 확인하고 종목별 데이터를 동기화합니다.
          </p>
        </div>
        <div className="admin-hero-actions">
          <Link to="/matches" className="btn btn-outline btn-sm">경기센터</Link>
          <Link to="/analysis" className="btn btn-primary btn-sm">AI 분석</Link>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2 className="admin-section-title">서비스 현황</h2>
            <p>운영자가 바로 확인해야 하는 핵심 지표입니다.</p>
          </div>
        </div>
        <div className="stat-grid stat-grid--priority">
          <AdminStatCard label="전체 사용자" value={data.totalUsers} />
          <AdminStatCard label="전체 경기" value={data.totalMatches} />
          <AdminStatCard label="라이브 경기" value={data.liveMatches} />
          <AdminStatCard label="AI 분석" value={data.totalAnalyses} />
          <AdminStatCard label="완료 분석" value={data.doneAnalyses} />
          <AdminStatCard label="실패 분석" value={data.failedAnalyses} />
          <AdminStatCard label="등록 팀" value={data.totalTeams} />
          <AdminStatCard label="등록 선수" value={data.totalPlayers} />
        </div>
      </section>

      <div className="admin-two-col admin-two-col--wide">
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2 className="admin-section-title">종목별 경기 비중</h2>
              <p>공통 경기 테이블에 저장된 축구, 야구, e스포츠 데이터입니다.</p>
            </div>
          </div>
          <BarChart items={sportChartItems} total={data.totalMatches || 0} />
        </section>

        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2 className="admin-section-title">AI 분석 상태</h2>
              <p>분석 생성 성공, 실패, 대기 상태를 추적합니다.</p>
            </div>
          </div>
          <BarChart items={analysisChartItems} total={data.totalAnalyses || 0} />
        </section>
      </div>

      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2 className="admin-section-title">사용자 활동 지표</h2>
            <p>현재는 방문 로그 테이블이 없어 실제 접속률 대신 가입, 관심 팀, 예측 참여 데이터를 보여줍니다.</p>
          </div>
        </div>
        <BarChart items={activityItems} />
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2 className="admin-section-title">종목별 데이터 관리</h2>
            <p>축구, 야구, e스포츠를 같은 기간 기준으로 공통 경기 테이블에 동기화합니다.</p>
          </div>
          <div className="admin-sync-panel admin-sync-panel--compact">
            <label>
              <span>시작일</span>
              <input
                type="date"
                value={syncStartDate}
                onChange={(e) => setSyncStartDate(e.target.value)}
              />
            </label>
            <label>
              <span>종료일</span>
              <input
                type="date"
                value={syncEndDate}
                onChange={(e) => setSyncEndDate(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="admin-sync-cards">
          {Object.entries(SYNC_CONFIG).map(([sportType, config]) => {
            const state = syncState[sportType];
            return (
              <article key={sportType} className="admin-sync-card">
                <div>
                  <strong>{config.name} 데이터</strong>
                  <p>{config.description}</p>
                </div>
                <div className="admin-sync-card-actions">
                  <StatusPill>{sportCounts[sportType] || 0} 경기</StatusPill>
                  <Link to={config.path} className="btn btn-outline btn-sm">경기 보기</Link>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSync(sportType)}
                  disabled={state?.loading}
                >
                  {state?.loading ? '동기화 중...' : config.button}
                </button>
                <SyncSummary state={state} />
              </article>
            );
          })}
        </div>
      </section>

      <div className="admin-two-col admin-two-col--wide">
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2 className="admin-section-title">최근 경기</h2>
              <p>최근 저장 또는 갱신된 경기 데이터입니다.</p>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>경기</th>
                  <th>스코어</th>
                  <th>종목</th>
                  <th>상태</th>
                  <th>경기일</th>
                </tr>
              </thead>
              <tbody>
                {data.recentMatches.map((match) => (
                  <tr key={match.matchId}>
                    <td>{match.matchId}</td>
                    <td>{match.homeTeamName} vs {match.awayTeamName}</td>
                    <td>{match.homeScore != null ? `${match.homeScore} : ${match.awayScore}` : '-'}</td>
                    <td>{SPORT_LABELS[match.sportType] || match.sportType}</td>
                    <td>{match.status}</td>
                    <td>{formatDate(match.matchDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2 className="admin-section-title">최근 가입 사용자</h2>
              <p>사용자 유입 흐름을 빠르게 확인합니다.</p>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>아이디</th>
                  <th>닉네임</th>
                  <th>가입일</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>{user.userId}</td>
                    <td>{user.username}</td>
                    <td>{user.nickname || '-'}</td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
