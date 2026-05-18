import { useState, useEffect } from 'react';
import { getAdminDashboard } from '../api/adminApi';
import AdminStatCard from '../components/AdminStatCard';

const SPORT_LABELS = { SOCCER: '축구', BASEBALL: '야구', ESPORTS: 'e스포츠' };
const STATUS_LABELS = {
  NOT_CREATED: '미생성',
  GENERATING: '생성중',
  DONE: '완료',
  FAILED: '실패',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getAdminDashboard(controller.signal)
      .then(res => setData(res.data.data))
      .catch(err => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setError('대시보드를 불러오지 못했습니다.');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) return <div className="loading-text">로딩 중...</div>;
  if (error) return <div className="error-text">{error}</div>;
  if (!data) return null;

  return (
    <div className="admin-page">
      <h1 className="page-title">관리자 대시보드</h1>

      <section className="admin-section">
        <h2 className="admin-section-title">전체 통계</h2>
        <div className="stat-grid">
          <AdminStatCard label="전체 사용자" value={data.totalUsers} />
          <AdminStatCard label="전체 경기" value={data.totalMatches} />
          <AdminStatCard label="라이브 경기" value={data.liveMatches} />
          <AdminStatCard label="리그" value={data.totalLeagues} />
          <AdminStatCard label="팀" value={data.totalTeams} />
          <AdminStatCard label="선수" value={data.totalPlayers} />
          <AdminStatCard label="즐겨찾기 팀" value={data.totalFavoriteTeams} />
          <AdminStatCard label="전체 AI 분석" value={data.totalAnalyses} />
          <AdminStatCard label="완료 분석" value={data.doneAnalyses} />
          <AdminStatCard label="실패 분석" value={data.failedAnalyses} />
          <AdminStatCard label="승부 예측 투표" value={data.totalPredictionVotes} />
        </div>
      </section>

      <div className="admin-two-col">
        <section className="admin-section">
          <h2 className="admin-section-title">종목별 경기 수</h2>
          <ul className="count-list">
            {data.matchCountBySportType.map(item => (
              <li key={item.sportType} className="count-list-item">
                <span>{SPORT_LABELS[item.sportType] || item.sportType}</span>
                <span className="count-badge">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">분석 상태별 현황</h2>
          <ul className="count-list">
            {data.analysisCountByStatus.map(item => (
              <li key={item.status} className="count-list-item">
                <span>{STATUS_LABELS[item.status] || item.status}</span>
                <span className="count-badge">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="admin-section">
        <h2 className="admin-section-title">최근 경기</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>홈팀</th>
                <th>원정팀</th>
                <th>스코어</th>
                <th>종목</th>
                <th>상태</th>
                <th>경기일</th>
              </tr>
            </thead>
            <tbody>
              {data.recentMatches.map(m => (
                <tr key={m.matchId}>
                  <td>{m.matchId}</td>
                  <td>{m.homeTeamName}</td>
                  <td>{m.awayTeamName}</td>
                  <td>
                    {m.homeScore != null ? `${m.homeScore} : ${m.awayScore}` : '-'}
                  </td>
                  <td>{SPORT_LABELS[m.sportType] || m.sportType}</td>
                  <td>{m.status}</td>
                  <td>{m.matchDate ? new Date(m.matchDate).toLocaleDateString('ko-KR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">최근 가입 사용자</h2>
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
              {data.recentUsers.map(u => (
                <tr key={u.userId}>
                  <td>{u.userId}</td>
                  <td>{u.username}</td>
                  <td>{u.nickname || '-'}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
