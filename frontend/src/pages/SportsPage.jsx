import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMatches, getMatchSections } from '../api/matchApi';
import MatchCard from '../components/MatchCard';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import './SportsPage.css';


const SPORTS = {
  baseball: {
    key: 'baseball',
    apiKey: 'BASEBALL',
    label: '야구',
    icon: '⚾',
    description: 'KBO·MLB 경기 일정과 결과, 팀 순위를 한곳에서 확인하세요.',
    ready: true,
  },
  soccer: {
    key: 'soccer',
    apiKey: 'SOCCER',
    label: '축구',
    icon: '⚽',
    description: 'K League 1 등 등록된 축구 경기와 팀 순위를 확인하세요.',
    ready: true,
  },
  esports: {
    key: 'esports',
    apiKey: 'ESPORTS',
    label: 'E스포츠',
    icon: '🎮',
    description: 'LCK 등 등록된 e스포츠 경기와 팀 순위를 확인하세요.',
    ready: true,
  },
};

const TABS = [SPORTS.baseball, SPORTS.soccer, SPORTS.esports];

function BaseballMatches({ apiKey }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getMatches({ sportType: apiKey, sort: 'latest', page: 0, size: 6 }, controller.signal)
      .then((res) => setMatches(res.data?.content ?? []))
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setError('경기 목록을 불러오지 못했습니다.');
        setMatches([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiKey]);

  if (loading) return <LoadingState message="경기 정보를 불러오는 중..." />;
  if (error) return <ErrorBox message={error} />;
  if (matches.length === 0) {
    return (
      <EmptyState
        title="표시할 경기가 없습니다"
        description="아직 등록된 경기가 없습니다. 전체 경기 페이지에서 다른 조건으로 검색해보세요."
      />
    );
  }

  return (
    <div className="sports-match-grid">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} compact />
      ))}
    </div>
  );
}

// 축구·E스포츠 주요 경기. paged /api/matches 는 E스포츠에서 지연로딩 500 이슈가 있어,
// 서비스 트랜잭션 내부에서 DTO로 매핑되는 /api/matches/sections 를 사용한다(야구와 동일한 카드로 렌더).
function SportMatches({ apiKey }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getMatchSections({ sportType: apiKey }, controller.signal)
      .then((res) => {
        const { liveMatches = [], recentFinishedMatches = [], upcomingMatches = [] } = res.data ?? {};
        setMatches([...liveMatches, ...recentFinishedMatches, ...upcomingMatches].slice(0, 6));
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setError('경기 목록을 불러오지 못했습니다.');
        setMatches([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiKey]);

  if (loading) return <LoadingState message="경기 정보를 불러오는 중..." />;
  if (error) return <ErrorBox message={error} />;
  if (matches.length === 0) {
    return (
      <EmptyState
        title="표시할 경기가 없습니다"
        description="아직 등록된 경기가 없습니다. 전체 경기 페이지에서 다른 조건으로 검색해보세요."
      />
    );
  }

  return (
    <div className="sports-match-grid">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} compact />
      ))}
    </div>
  );
}

export default function SportsPage() {
  const { sportType } = useParams();
  const navigate = useNavigate();
  const sport = SPORTS[sportType] ?? SPORTS.baseball;
  const isUnknown = !SPORTS[sportType];

  return (
    <div className="sports-page">
      {isUnknown && (
        <div className="sports-notice">
          알 수 없는 종목입니다. 기본으로 야구 화면을 표시합니다.
        </div>
      )}

      <section className="sports-hero card">
        <div className="sports-hero-icon" aria-hidden="true">{sport.icon}</div>
        <div className="sports-hero-body">
          <h1 className="page-title sports-hero-title">{sport.label}</h1>
          <p className="sports-hero-desc">{sport.description}</p>
          <div className="sports-hero-cta">
            <Link to={`/matches?sportType=${sport.apiKey}`} className="btn btn-primary">
              경기 보기
            </Link>
            <Link to={`/rankings/${sport.key}`} className="btn btn-secondary">
              순위 보기
            </Link>
            <Link to="/favorites" className="btn btn-secondary">
              관심팀 설정
            </Link>
          </div>
        </div>
      </section>

      <nav className="sports-tabs" aria-label="종목 선택">
        {TABS.map((t) => {
          const active = t.key === sport.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`sports-tab${active ? ' sports-tab--active' : ''}`}
              onClick={() => navigate(`/sports/${t.key}`)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="sports-tab-icon" aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </nav>

      <section className="sports-body">
        <h2 className="sports-section-title">{sport.label} 주요 경기</h2>
        {sport.key === 'baseball' ? (
          <BaseballMatches apiKey={sport.apiKey} />
        ) : (
          <SportMatches apiKey={sport.apiKey} />
        )}
      </section>

      <section className="sports-quick">
        <h2 className="sports-section-title">바로 이동</h2>
        <div className="sports-quick-grid">
          <Link to={`/matches?sportType=${sport.apiKey}`} className="sports-quick-card card">
            <span className="sports-quick-icon" aria-hidden="true">📅</span>
            <span className="sports-quick-title">경기 목록</span>
            <span className="sports-quick-desc">전체 일정·결과 검색</span>
          </Link>
          <Link to={`/rankings/${sport.key}`} className="sports-quick-card card">
            <span className="sports-quick-icon" aria-hidden="true">🏆</span>
            <span className="sports-quick-title">순위</span>
            <span className="sports-quick-desc">리그 팀 순위 보기</span>
          </Link>
          <Link to="/favorites" className="sports-quick-card card">
            <span className="sports-quick-icon" aria-hidden="true">⭐</span>
            <span className="sports-quick-title">관심팀</span>
            <span className="sports-quick-desc">내 즐겨찾기 관리</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
