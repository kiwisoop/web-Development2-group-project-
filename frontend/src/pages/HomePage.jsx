import { Link } from 'react-router-dom';
import ScoreTicker from '../components/ScoreTicker';
import RecommendedTeamSection from '../components/RecommendedTeamSection';
import FeaturedMatches from '../components/FeaturedMatches';

const sports = [
  { id: 'soccer', name: '축구', emoji: '⚽', desc: '전 세계 축구 경기 일정과 결과를 확인하세요.' },
  { id: 'baseball', name: '야구', emoji: '⚾', desc: '국내외 야구 경기 분석을 제공합니다.' },
  { id: 'esports', name: 'E스포츠', emoji: '🎮', desc: 'AI 분석이 지원되는 E스포츠 경기를 확인하세요.' },
];

export default function HomePage() {
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
