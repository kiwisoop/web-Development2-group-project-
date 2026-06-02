import { Link, Navigate, useParams } from 'react-router-dom';

const SPORTS = [
  {
    key: 'soccer',
    label: '축구',
    badge: 'K League',
    image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    description: 'K리그 일정, 결과, 순위와 팀별 경기 흐름을 한 화면에서 확인합니다.',
    stats: ['일정', '순위', '팀 로고'],
    primaryPath: '/sports/soccer',
    primaryLabel: '축구 홈',
    secondaryPath: '/rankings/soccer',
    secondaryLabel: '축구 순위',
  },
  {
    key: 'baseball',
    label: '야구',
    badge: 'MLB',
    image: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=1200&q=80',
    description: 'MLB 일정, 라인스코어, 투구 기록과 AI 리포트를 대시보드처럼 탐색합니다.',
    stats: ['라인스코어', '투구', 'AI 요약'],
    primaryPath: '/sports/baseball',
    primaryLabel: '야구 홈',
    secondaryPath: '/rankings/baseball',
    secondaryLabel: '야구 순위',
  },
  {
    key: 'esports',
    label: 'e스포츠',
    badge: 'LCK',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    description: 'LCK 경기 결과, 선수 스탯, 팀 정보, 순위와 AI 분석을 함께 확인합니다.',
    stats: ['경기 결과', '팀 정보', 'AI 분석'],
    primaryPath: '/sports/esports',
    primaryLabel: 'e스포츠 홈',
    secondaryPath: '/rankings/esports',
    secondaryLabel: 'e스포츠 순위',
  },
];

const SPORT_FALLBACKS = {
  baseball: '/sports/baseball',
  soccer: '/sports/soccer',
  esports: '/sports/esports',
};

export default function SportsPage() {
  const { sportType } = useParams();

  if (sportType) {
    const target = SPORT_FALLBACKS[sportType];
    return <Navigate to={target || '/sports'} replace />;
  }

  return (
    <div className="sports-page sports-hub sports-hub--immersive">
      <section className="sports-hub-hero sports-hub-hero--visual">
        <div>
          <span className="section-kicker">Sports Hub</span>
          <h1 className="page-title">스포츠</h1>
          <p className="page-desc">
            축구, 야구, e스포츠를 같은 기준으로 탐색합니다. 일정, 순위, 경기 상세와 분석 화면으로 바로 이동할 수 있습니다.
          </p>
        </div>
        <Link to="/matches" className="btn btn-primary">전체 경기 일정</Link>
      </section>

      <section className="sports-hub-grid">
        {SPORTS.map((sport) => (
          <article key={sport.key} className={`sports-hub-card sports-hub-card--${sport.key}`}>
            <div className="sports-hub-media" style={{ backgroundImage: `url(${sport.image})` }}>
              <span>{sport.badge}</span>
            </div>
            <div className="sports-hub-body">
              <div>
                <span className="sports-hub-label">{sport.label}</span>
                <h2>{sport.label}</h2>
                <p>{sport.description}</p>
              </div>
              <div className="sports-hub-tags">
                {sport.stats.map((item) => <span key={item}>{item}</span>)}
              </div>
              <div className="sports-hub-actions">
                <Link to={sport.primaryPath} className="btn btn-primary btn-sm">{sport.primaryLabel}</Link>
                <Link to={sport.secondaryPath} className="btn btn-outline btn-sm">{sport.secondaryLabel}</Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
