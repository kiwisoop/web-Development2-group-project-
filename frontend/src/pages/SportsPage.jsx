import { Link, Navigate, useParams } from 'react-router-dom';

const SPORTS = [
  {
    key: 'soccer',
    label: '축구',
    code: 'SO',
    description: 'K리그 일정, 결과, 순위와 경기 분석을 확인합니다.',
    primaryPath: '/sports/soccer',
    primaryLabel: '축구 홈',
    secondaryPath: '/soccer/fixtures',
    secondaryLabel: '경기 일정',
  },
  {
    key: 'baseball',
    label: '야구',
    code: 'BB',
    description: 'MLB 경기 목록, 라인업, 기록, 중계형 상세 분석을 봅니다.',
    primaryPath: '/matches?sportType=BASEBALL',
    primaryLabel: '야구 경기',
    secondaryPath: '/rankings/baseball',
    secondaryLabel: '야구 순위',
  },
  {
    key: 'esports',
    label: 'e스포츠',
    code: 'ES',
    description: 'LCK 경기 결과, 선수 스탯, 팀 순위와 AI 요약을 확인합니다.',
    primaryPath: '/sports/esports',
    primaryLabel: 'e스포츠 홈',
    secondaryPath: '/rankings/esports',
    secondaryLabel: 'e스포츠 순위',
  },
];

const SPORT_FALLBACKS = {
  baseball: '/matches?sportType=BASEBALL',
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
    <div className="sports-page">
      <div className="page-head">
        <h1 className="page-title">스포츠</h1>
        <p className="page-desc">축구, 야구, e스포츠 화면을 한곳에서 선택하세요.</p>
      </div>

      <section className="sports-section">
        <div className="sport-cards">
          {SPORTS.map((sport) => (
            <article key={sport.key} className="sport-card card">
              <div className="sport-emoji">{sport.code}</div>
              <h3>{sport.label}</h3>
              <p>{sport.description}</p>
              <div className="sport-card-actions">
                <Link to={sport.primaryPath} className="btn btn-primary btn-sm">
                  {sport.primaryLabel}
                </Link>
                <Link to={sport.secondaryPath} className="btn btn-outline btn-sm">
                  {sport.secondaryLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
