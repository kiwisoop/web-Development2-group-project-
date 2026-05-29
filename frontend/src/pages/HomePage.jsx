import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getMatchSections } from '../api/matchApi';
import ScoreTicker from '../components/ScoreTicker';
import RecommendedTeamSection from '../components/RecommendedTeamSection';
import FeaturedMatches from '../components/FeaturedMatches';
import MatchCard from '../components/MatchCard';

const SPORTS = [
  {
    key: 'soccer',
    label: '축구',
    description: 'K리그 일정, 결과, 순위, 경기 분석',
    path: '/sports/soccer',
  },
  {
    key: 'baseball',
    label: '야구',
    description: 'MLB 라인업, 기록, 중계, 존 차트',
    path: '/matches?sportType=BASEBALL',
  },
  {
    key: 'esports',
    label: 'e스포츠',
    description: 'LCK 경기, 선수 스탯, AI 요약',
    path: '/sports/esports',
  },
];

const SLIDES = [
  { src: '/images/premier-league.jpg', label: 'Premier League' },
  { src: '/images/esport.jpg', label: 'E스포츠' },
  { src: '/images/mlb.jpg', label: 'MLB' },
];

function collectMatches(sections) {
  if (!sections) return [];
  return [
    ...(sections.liveMatches || []),
    ...(sections.recentFinishedMatches || []),
    ...(sections.upcomingMatches || []),
  ];
}

function MiniMatchList({ title, description, matches, actionPath, actionLabel }) {
  return (
    <section className="dashboard-panel card">
      <div className="dashboard-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link to={actionPath} className="btn btn-outline btn-sm">{actionLabel}</Link>
      </div>
      {matches.length === 0 ? (
        <p className="dashboard-empty">표시할 경기가 없습니다.</p>
      ) : (
        <div className="dashboard-mini-grid">
          {matches.slice(0, 3).map((match) => (
            <MatchCard key={match.id} match={match} compact />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [sections, setSections] = useState(null);
  const timerRef = useRef(null);

  const goTo = (next) => {
    if (next === current) return;
    setPrev(current);
    setCurrent(next);
    setTimeout(() => setPrev(null), 600);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(i => {
        const next = (i + 1) % SLIDES.length;
        setPrev(i);
        setTimeout(() => setPrev(null), 600);
        return next;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getMatchSections({}, controller.signal)
      .then((res) => setSections(res.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, []);

  const allMatches = collectMatches(sections);
  const liveMatches = sections?.liveMatches || [];
  const analysisMatches = allMatches.filter((match) => match.analysisAvailable);
  const upcomingMatches = sections?.upcomingMatches || [];

  return (
    <div className="home-page">
      <section className="hero hero-slideshow">
        <div className="hero-slides">
          {SLIDES.map((slide, i) => {
            let cls = 'hero-slide';
            if (i === current) cls += ' active';
            else if (i === prev) cls += ' leaving';
            else cls += ' waiting';
            return (
              <div
                key={slide.label}
                className={cls}
                style={{ backgroundImage: `url(${slide.src})` }}
              />
            );
          })}
          <div className="hero-slide-overlay" />
        </div>

        <div className="hero-content">
          <span className="hero-kicker">SPORT DATA PLATFORM</span>
          <h1 className="hero-title">오늘 볼 경기와 분석을 한 화면에서</h1>
          <p className="hero-desc">진행 중 경기, 분석 가능한 경기, 내 팀 흐름을 빠르게 확인하는 스포츠 분석 대시보드입니다.</p>
          <div className="hero-actions">
            <Link to="/analysis" className="btn btn-primary btn-lg">AI 분석 보기</Link>
            <Link to="/matches" className="btn btn-outline btn-lg">경기센터</Link>
          </div>
        </div>

        <div className="hero-metrics" aria-label="서비스 요약">
          <div>
            <span>3</span>
            <strong>종목 통합</strong>
          </div>
          <div>
            <span>LIVE</span>
            <strong>경기 흐름</strong>
          </div>
          <div>
            <span>AI</span>
            <strong>분석 요약</strong>
          </div>
        </div>

        <div className="hero-dots">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              className={`hero-dot${i === current ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`${slide.label} 보기`}
            />
          ))}
        </div>
      </section>

      <ScoreTicker />

      <section className="home-dashboard-grid">
        <Link to="/matches?status=LIVE" className="dashboard-kpi card">
          <span>진행 중</span>
          <strong>{liveMatches.length}</strong>
          <em>실시간 경기</em>
        </Link>
        <Link to="/analysis" className="dashboard-kpi card">
          <span>AI 분석</span>
          <strong>{analysisMatches.length}</strong>
          <em>분석 가능한 경기</em>
        </Link>
        <Link to="/matches?sort=oldest" className="dashboard-kpi card">
          <span>예정</span>
          <strong>{upcomingMatches.length}</strong>
          <em>다가오는 경기</em>
        </Link>
        <Link to="/favorites" className="dashboard-kpi card">
          <span>내 팀</span>
          <strong>MY</strong>
          <em>추천팀 맞춤 분석</em>
        </Link>
      </section>

      <MiniMatchList
        title="지금 확인할 경기"
        description="진행 중이거나 바로 확인할 가치가 높은 경기입니다."
        matches={liveMatches.length > 0 ? liveMatches : upcomingMatches}
        actionPath="/matches"
        actionLabel="경기센터"
      />

      <MiniMatchList
        title="AI 분석 가능한 경기"
        description="상세 기록과 경기 맥락을 바탕으로 분석을 볼 수 있습니다."
        matches={analysisMatches}
        actionPath="/analysis"
        actionLabel="분석 전체"
      />

      <section className="home-sports-showcase">
        <div className="section-head-row">
          <div>
            <span className="section-kicker">Sports</span>
            <h2 className="section-title">종목별 화면</h2>
          </div>
          <Link to="/sports" className="btn btn-outline btn-sm">전체 종목 보기</Link>
        </div>
        <div className="sport-cards">
          {SPORTS.map((sport) => (
            <Link key={sport.key} to={sport.path} className="sport-card card">
              <div className="sport-emoji">{sport.key.slice(0, 2).toUpperCase()}</div>
              <h3>{sport.label}</h3>
              <p>{sport.description}</p>
              <span className="sport-card-link">바로 보기</span>
            </Link>
          ))}
        </div>
      </section>

      <FeaturedMatches />
      <RecommendedTeamSection />
    </div>
  );
}
