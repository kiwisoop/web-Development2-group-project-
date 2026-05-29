import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMatches } from '../api/matchApi';
import MatchCard from '../components/MatchCard';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';

const SPORT_LABELS = {
  SOCCER: '축구',
  BASEBALL: '야구',
  ESPORTS: 'e스포츠',
};

const ANALYSIS_QUERIES = [
  { sportType: 'SOCCER', status: 'FINAL', size: 100 },
  { sportType: 'BASEBALL', status: 'FINAL', size: 80 },
  { sportType: 'BASEBALL', status: 'LIVE', size: 40 },
  { sportType: 'ESPORTS', status: 'FINAL', size: 100 },
];

function uniqueMatches(matches) {
  return Array.from(new Map(matches.map((match) => [match.id, match])).values())
    .sort((a, b) => new Date(b.matchDate || 0) - new Date(a.matchDate || 0));
}

function getDetailPath(match) {
  if (match.sportType === 'SOCCER' && match.externalId?.startsWith('KLEAGUE-')) {
    return `/soccer/fixtures/${match.externalId.replace('KLEAGUE-', '')}`;
  }
  if (match.sportType === 'ESPORTS') {
    return '/sports/esports';
  }
  return `/matches/${match.id}`;
}

export default function AnalysisPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sport, setSport] = useState('ALL');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all(ANALYSIS_QUERIES.map((params) => getMatches(params, controller.signal)))
      .then((responses) => {
        const merged = responses.flatMap((res) => res.data.content || []);
        setMatches(uniqueMatches(merged).filter((match) => match.analysisAvailable));
      })
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('분석 가능한 경기를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const analysisMatches = useMemo(() => {
    if (sport === 'ALL') return matches;
    return matches.filter((match) => match.sportType === sport);
  }, [matches, sport]);

  const counts = {
    available: matches.length,
    live: matches.filter((match) => match.status === 'LIVE').length,
    finished: matches.filter((match) => match.status === 'FINAL').length,
  };

  return (
    <div className="analysis-page">
      <section className="analysis-hero card">
        <div>
          <span className="section-kicker">AI Analysis</span>
          <h1 className="page-title">분석 가능한 경기</h1>
          <p className="page-desc">
            축구, 야구, e스포츠의 완료 경기와 야구 라이브 경기 중 AI 요약을 확인할 수 있는 경기를 모았습니다.
          </p>
        </div>
        <div className="analysis-hero-stats">
          <div><strong>{counts.available}</strong><span>분석 가능</span></div>
          <div><strong>{counts.live}</strong><span>진행 중</span></div>
          <div><strong>{counts.finished}</strong><span>완료 경기</span></div>
        </div>
      </section>

      <div className="analysis-toolbar">
        {['ALL', 'SOCCER', 'BASEBALL', 'ESPORTS'].map((key) => (
          <button
            key={key}
            type="button"
            className={`btn ${sport === key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSport(key)}
          >
            {key === 'ALL' ? '전체' : SPORT_LABELS[key]}
          </button>
        ))}
      </div>

      {loading && <LoadingState />}
      {error && <ErrorBox message={error} />}

      {!loading && !error && analysisMatches.length === 0 && (
        <EmptyState
          title="분석 가능한 경기가 없습니다"
          description="경기 종료 후 상세 데이터가 준비되면 이곳에 표시됩니다."
        />
      )}

      {!loading && !error && analysisMatches.length > 0 && (
        <div className="match-grid">
          {analysisMatches.map((match) => (
            <MatchCard key={match.id} match={match} detailPath={getDetailPath(match)} />
          ))}
        </div>
      )}

      <div className="analysis-footer card">
        <strong>더 많은 경기를 찾고 있나요?</strong>
        <Link to="/matches" className="btn btn-outline btn-sm">경기센터로 이동</Link>
      </div>
    </div>
  );
}
