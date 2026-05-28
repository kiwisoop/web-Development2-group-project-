import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import ScoreTicker from '../components/ScoreTicker';
import RecommendedTeamSection from '../components/RecommendedTeamSection';
import FeaturedMatches from '../components/FeaturedMatches';

const sports = [
  { id: 'soccer', name: '축구', emoji: 'SO', desc: '전 세계 축구 경기 일정과 결과를 확인하세요.' },
  { id: 'baseball', name: '야구', emoji: 'BB', desc: 'MLB 경기 상세 정보와 분석을 제공합니다.' },
  { id: 'esports', name: 'E스포츠', emoji: 'ES', desc: 'LCK 경기 일정, 선수 기록, AI 분석을 확인하세요.' },
];

const SLIDES = [
  { src: '/images/premier-league.jpg', label: 'Premier League' },
  { src: '/images/esport.jpg', label: 'E스포츠' },
  { src: '/images/mlb.jpg', label: 'MLB' },
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
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
          <h1 className="hero-title">스포츠 경기 분석 플랫폼</h1>
          <p className="hero-desc">축구, 야구, E스포츠 경기 데이터를 한곳에서 확인하고 분석하세요.</p>
          <div className="hero-actions">
            <Link to="/matches" className="btn btn-primary btn-lg">경기 목록 보기</Link>
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
