import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMatchSections } from '../api/matchApi';
import ScoreTicker from '../components/ScoreTicker';
import RecommendedTeamSection from '../components/RecommendedTeamSection';
import FeaturedMatches from '../components/FeaturedMatches';
import './HomePage.css';

const sports = [
  { id: 'soccer', name: '축구', emoji: '⚽', desc: '전 세계 축구 경기 일정과 결과를 확인하세요.' },
  { id: 'baseball', name: '야구', emoji: '⚾', desc: '국내외 야구 경기 분석을 제공합니다.' },
  { id: 'esports', name: 'E스포츠', emoji: '🎮', desc: 'AI 분석이 지원되는 E스포츠 경기를 확인하세요.' },
];

function useMatchSummary() {
  const [state, setState] = useState({ loading: true, failed: false, counts: null });

  useEffect(() => {
    const controller = new AbortController();
    getMatchSections({}, controller.signal)
      .then((res) => {
        const { liveMatches = [], recentFinishedMatches = [], upcomingMatches = [] } = res.data ?? {};
        setState({
          loading: false,
          failed: false,
          counts: {
            total: liveMatches.length + recentFinishedMatches.length + upcomingMatches.length,
            live: liveMatches.length,
            finished: recentFinishedMatches.length,
            upcoming: upcomingMatches.length,
          },
        });
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setState({ loading: false, failed: true, counts: null });
      });
    return () => controller.abort();
  }, []);

  return state;
}

function HomeSummary({ summary }) {
  // API 실패 시 홈 전체가 깨지지 않도록 섹션 자체를 숨긴다.
  if (summary.failed) return null;

  const items = [
    { key: 'total', label: '표시 경기', value: summary.counts?.total, accent: 'home-summary-value--total' },
    { key: 'live', label: '진행 중', value: summary.counts?.live, accent: 'home-summary-value--live' },
    { key: 'finished', label: '종료', value: summary.counts?.finished, accent: 'home-summary-value--finished' },
  ];

  return (
    <section className="home-summary" aria-label="오늘의 경기 요약">
      <div className="home-summary-head">
        <h2 className="section-title home-summary-title">오늘의 경기 요약</h2>
        <Link to="/matches?status=FINAL" className="btn btn-outline btn-sm home-summary-cta">
          분석 가능 경기 보기
        </Link>
      </div>
      <div className="home-summary-grid">
        {items.map((it) => (
          <div key={it.key} className="home-summary-card card">
            <span className="home-summary-label">{it.label}</span>
            <span className={`home-summary-value ${it.accent}`}>
              {summary.loading ? <span className="home-summary-skeleton" aria-label="불러오는 중" /> : it.value ?? 0}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function UpcomingBanner({ summary }) {
  // 실패하거나 로딩 중이거나 예정 경기가 없으면 표시하지 않는다.
  if (summary.failed || summary.loading) return null;
  const count = summary.counts?.upcoming ?? 0;
  if (count === 0) return null;

  return (
    <div className="home-upcoming-banner" role="note">
      <span className="home-upcoming-text">
        예정 경기 <strong>{count}개</strong> · 전체 경기 목록에서 확인
      </span>
      <Link to="/matches?status=SCHEDULED" className="home-upcoming-link">
        예정 경기 보기 →
      </Link>
    </div>
  );
}

export default function HomePage() {
  const summary = useMatchSummary();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">스포츠 경기 분석 플랫폼</h1>
          <p className="hero-desc">AI 기반 경기 분석으로 더 깊은 스포츠 인사이트를 경험하세요.</p>
          <div className="hero-actions">
            <Link to="/matches" className="btn btn-primary btn-lg">경기 목록 보기</Link>
            <Link to="/sports/soccer" className="btn btn-outline btn-lg">축구 보기</Link>
          </div>
        </div>
      </section>

      <HomeSummary summary={summary} />

      <ScoreTicker />

      <UpcomingBanner summary={summary} />

      <RecommendedTeamSection />

      <section className="sports-section">
        <h2 className="section-title">종목 선택</h2>
        <div className="sport-cards">
          {sports.map((sport) => (
            <Link to={`/sports/${sport.id}`} key={sport.id} className="sport-card card">
              <div className="sport-emoji">{sport.emoji}</div>
              <h3>{sport.name}</h3>
              <p>{sport.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <FeaturedMatches />
    </div>
  );
}
