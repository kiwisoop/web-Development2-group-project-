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
  { sportType: 'SOCCER', status: 'FINAL', size: 120 },
  { sportType: 'BASEBALL', status: 'FINAL', size: 120 },
  { sportType: 'ESPORTS', status: 'FINAL', size: 120 },
];

function uniqueMatches(matches) {
  return Array.from(new Map(matches.map((match) => [match.id || match.externalId, match])).values())
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

  return (
    <div className="analysis-page">
      <section className="analysis-hero analysis-hero--visual card">
        <div className="analysis-hero-copy">
          <span className="section-kicker">AI Analysis</span>
          <h1 className="page-title">분석 가능한 경기</h1>
          <p className="page-desc">
            종료된 경기 중 상세 기록과 AI 요약 데이터가 준비된 경기만 모았습니다.
            실시간처럼 보이는 오래된 경기는 제외하고, 실제로 분석 가능한 경기만 보여줍니다.
          </p>
          <div className="analysis-hero-actions">
            <Link to="/matches" className="btn btn-primary">경기센터 보기</Link>
            <Link to="/sports" className="btn btn-outline">종목별 탐색</Link>
          </div>
        </div>
        <div className="analysis-hero-media" aria-hidden="true">
          <span>AI Report</span>
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
          description="경기가 종료되고 상세 데이터가 준비되면 이곳에 표시됩니다."
        />
      )}

      {!loading && !error && analysisMatches.length > 0 && (
        <div className="match-grid">
          {analysisMatches.map((match) => (
            <MatchCard key={match.id || match.externalId} match={match} detailPath={getDetailPath(match)} />
          ))}
        </div>
      )}

      <div className="analysis-footer card">
        <strong>원하는 경기를 찾고 있나요?</strong>
        <Link to="/matches" className="btn btn-outline btn-sm">경기센터로 이동</Link>
      </div>
    </div>
  );
}
