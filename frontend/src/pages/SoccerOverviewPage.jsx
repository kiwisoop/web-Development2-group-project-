import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFixtures, getStandings } from '../api/soccerApi';
import MatchCard from '../components/MatchCard';
import RankingTable from '../components/RankingTable';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';

const SOCCER_SEASON = '2026';

const sectionHeadStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  gap: '1rem',
};

export default function SoccerOverviewPage() {
  const [upcoming, setUpcoming] = useState({ loading: true, error: null, data: [] });
  const [recent, setRecent]     = useState({ loading: true, error: null, data: [] });
  const [ranking, setRanking]   = useState({ loading: true, error: null, data: [] });

  useEffect(() => {
    const controller = new AbortController();

    getFixtures(
      { season: SOCCER_SEASON, status: 'NS', size: 6, sort: 'oldest' },
      controller.signal,
    )
      .then((res) => setUpcoming({ loading: false, error: null, data: res.data.data.content || [] }))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setUpcoming({ loading: false, error: '예정 경기를 불러오지 못했습니다.', data: [] });
      });

    getFixtures(
      { season: SOCCER_SEASON, status: 'FT', size: 6, sort: 'latest' },
      controller.signal,
    )
      .then((res) => setRecent({ loading: false, error: null, data: res.data.data.content || [] }))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setRecent({ loading: false, error: '최근 경기를 불러오지 못했습니다.', data: [] });
      });

    getStandings(SOCCER_SEASON, controller.signal)
      .then((res) => setRanking({ loading: false, error: null, data: (res.data.data || []).slice(0, 5) }))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setRanking({ loading: false, error: '랭킹을 불러오지 못했습니다.', data: [] });
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="sports-page">
      <div className="page-head">
        <h1 className="page-title">⚽ 축구</h1>
        <p className="page-desc">K리그 경기 일정·결과·랭킹을 한눈에 확인하세요.</p>
      </div>

      <section className="sports-section">
        <div style={sectionHeadStyle}>
          <h2 className="section-title">📅 예정 경기</h2>
          <Link to="/soccer/fixtures?status=NS" className="btn btn-outline btn-sm">전체 보기 →</Link>
        </div>
        {upcoming.loading ? (
          <LoadingState />
        ) : upcoming.error ? (
          <ErrorBox message={upcoming.error} />
        ) : upcoming.data.length === 0 ? (
          <EmptyState title="예정된 경기가 없습니다" description="새로운 경기가 등록되면 여기에 표시됩니다." />
        ) : (
          <div className="match-grid">
            {upcoming.data.map((m) => (
              <MatchCard key={m.id} match={m} detailPath={`/soccer/fixtures/${m.id}`} />
            ))}
          </div>
        )}
      </section>

      <section className="sports-section">
        <div style={sectionHeadStyle}>
          <h2 className="section-title">🏆 최근 결과</h2>
          <Link to="/soccer/fixtures?status=FT" className="btn btn-outline btn-sm">전체 보기 →</Link>
        </div>
        {recent.loading ? (
          <LoadingState />
        ) : recent.error ? (
          <ErrorBox message={recent.error} />
        ) : recent.data.length === 0 ? (
          <EmptyState title="최근 종료된 경기가 없습니다" />
        ) : (
          <div className="match-grid">
            {recent.data.map((m) => (
              <MatchCard key={m.id} match={m} detailPath={`/soccer/fixtures/${m.id}`} />
            ))}
          </div>
        )}
      </section>

      <section className="sports-section">
        <div style={sectionHeadStyle}>
          <h2 className="section-title">📊 K리그 랭킹 Top 5</h2>
          <Link to="/soccer/standings" className="btn btn-outline btn-sm">전체 순위 보기 →</Link>
        </div>
        {ranking.loading ? (
          <LoadingState />
        ) : ranking.error ? (
          <ErrorBox message={ranking.error} />
        ) : ranking.data.length === 0 ? (
          <EmptyState title="등록된 팀 데이터가 없습니다" />
        ) : (
          <RankingTable rankings={ranking.data} sportType="SOCCER" />
        )}
      </section>
    </div>
  );
}
