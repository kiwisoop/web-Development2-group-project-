import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getFixture,
  getFixtureAnalysis,
  generateFixtureAnalysis,
  regenerateFixtureAnalysis,
} from '../api/soccerApi';
import Scoreboard from '../components/Scoreboard';
import AiAnalysisCard from '../components/AiAnalysisCard';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';

export default function SoccerFixtureDetailPage() {
  const { fixtureId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getFixture(fixtureId, controller.signal)
      .then((res) => setDetail(res.data.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('경기 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [fixtureId]);

  useEffect(() => {
    const controller = new AbortController();
    getFixtureAnalysis(fixtureId, controller.signal)
      .then((res) => setAnalysis(res.data.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        // 분석 미생성은 에러 아님 — null로 둠
      });
    return () => controller.abort();
  }, [fixtureId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateFixtureAnalysis(fixtureId);
      setAnalysis(res.data.data);
    } catch {
      setAnalysis({ status: 'FAILED', errorMessage: 'AI 분석 생성에 실패했습니다.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const res = await regenerateFixtureAnalysis(fixtureId);
      setAnalysis(res.data.data);
    } catch {
      setAnalysis({ status: 'FAILED', errorMessage: 'AI 분석 재생성에 실패했습니다.' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorBox message={error} />;
  if (!detail || !detail.fixture) return <ErrorBox message="경기 정보가 없습니다." />;

  const f = detail.fixture;
  const scoreboardMatch = {
    ...f,
    league: f.leagueName ? { leagueName: f.leagueName } : null,
  };

  return (
    <div className="match-list-page">
      <div className="page-head">
        <h1 className="page-title">K리그 경기 상세</h1>
        <p className="page-desc">
          <Link to="/soccer/fixtures">← 경기 목록으로</Link>
        </p>
      </div>

      <Scoreboard match={scoreboardMatch} />

      <section className="card" style={{ padding: '1.25rem' }}>
        <h2 className="section-title">경기 정보</h2>
        <dl className="fixture-info-grid">
          <dt>시즌</dt><dd>{f.season || '-'}</dd>
          <dt>라운드</dt><dd>{f.round || '-'}</dd>
          <dt>리그</dt><dd>{f.leagueName || '-'}</dd>
          <dt>일시</dt><dd>{detail.matchDateStr || (f.matchDate ?? '-')}</dd>
          <dt>경기장</dt><dd>{f.venue || '-'}</dd>
          <dt>관중</dt><dd>{detail.spectators || '-'}</dd>
        </dl>
      </section>

      <AiAnalysisCard
        matchStatus={f.status}
        analysis={analysis}
        onGenerate={handleGenerate}
        onRegenerate={handleRegenerate}
        generating={generating}
      />

      {f.thumbnailUrl && (
        <section className="card" style={{ padding: '1.25rem' }}>
          <h2 className="section-title">경기 썸네일</h2>
          <img
            src={f.thumbnailUrl}
            alt="경기 썸네일"
            style={{ width: '100%', maxWidth: 720, borderRadius: '0.5rem' }}
          />
        </section>
      )}
    </div>
  );
}
