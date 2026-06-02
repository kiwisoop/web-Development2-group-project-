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
import TeamLogo from '../components/TeamLogo';

function formatStatus(status) {
  if (status === 'FINAL') return '경기 종료';
  if (status === 'SCHEDULED') return '예정 경기';
  if (status === 'LIVE' || status === 'IN_PLAY') return '진행 중';
  return status || '상태 없음';
}

function teamDisplayName(team) {
  return team?.teamNameKr || team?.teamName || team?.shortName || '-';
}

function statValue(value) {
  return value == null || value === '' ? '-' : value;
}

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
  const hasScore = f.homeScore !== null && f.homeScore !== undefined
    && f.awayScore !== null && f.awayScore !== undefined;
  const homeWon = hasScore && Number(f.homeScore) > Number(f.awayScore);
  const awayWon = hasScore && Number(f.awayScore) > Number(f.homeScore);
  const heroImage = f.thumbnailUrl || f.homeTeam?.bannerUrl || f.awayTeam?.bannerUrl;

  return (
    <div className="match-list-page soccer-fixture-detail">
      <Link to="/soccer/fixtures" className="soccer-back-link">← 경기 목록으로</Link>

      <section className="soccer-detail-hero">
        {heroImage && <div className="soccer-detail-hero-media" style={{ backgroundImage: `url(${heroImage})` }} />}
        <div className="soccer-detail-hero-content">
          <div className="soccer-detail-meta-row">
            <span className={`soccer-status-chip soccer-status-chip--${f.status?.toLowerCase() || 'unknown'}`}>
              {formatStatus(f.status)}
            </span>
            <span>{f.leagueName || 'K리그'}</span>
            <span>{detail.matchDateStr || f.matchDate || '-'}</span>
          </div>

          <div className="soccer-score-stage">
            <div className={`soccer-hero-team${homeWon ? ' is-winner' : ''}`}>
              <TeamLogo team={f.homeTeam} size={72} radius={16} />
              <span className="soccer-team-side">홈</span>
              <strong>{teamDisplayName(f.homeTeam)}</strong>
              {f.homeTeam?.shortName && <small>{f.homeTeam.shortName}</small>}
            </div>

            <div className="soccer-hero-score">
              {hasScore ? (
                <>
                  <span className={homeWon ? 'winner-score' : ''}>{f.homeScore}</span>
                  <em>:</em>
                  <span className={awayWon ? 'winner-score' : ''}>{f.awayScore}</span>
                </>
              ) : (
                <strong>VS</strong>
              )}
            </div>

            <div className={`soccer-hero-team soccer-hero-team--away${awayWon ? ' is-winner' : ''}`}>
              <TeamLogo team={f.awayTeam} size={72} radius={16} />
              <span className="soccer-team-side">원정</span>
              <strong>{teamDisplayName(f.awayTeam)}</strong>
              {f.awayTeam?.shortName && <small>{f.awayTeam.shortName}</small>}
            </div>
          </div>

          <div className="soccer-detail-actions">
            <a className="btn btn-primary" href="#soccer-analysis">AI 분석</a>
            <a className="btn btn-outline" href="#soccer-info">경기 정보</a>
          </div>
        </div>
      </section>

      <div className="soccer-detail-grid">
        <section id="soccer-info" className="soccer-info-card">
          <div className="soccer-section-head">
            <span className="section-kicker">MATCH INFO</span>
            <h2>경기 정보</h2>
          </div>
          <dl className="soccer-info-list">
            <div><dt>시즌</dt><dd>{statValue(f.season)}</dd></div>
            <div><dt>라운드</dt><dd>{statValue(f.round)}</dd></div>
            <div><dt>리그</dt><dd>{statValue(f.leagueName)}</dd></div>
            <div><dt>일시</dt><dd>{statValue(detail.matchDateStr || f.matchDate)}</dd></div>
            <div><dt>경기장</dt><dd>{statValue(f.venue)}</dd></div>
            <div><dt>관중</dt><dd>{statValue(detail.spectators)}</dd></div>
          </dl>
        </section>

        <section className="soccer-team-compare-card">
          <div className="soccer-section-head">
            <span className="section-kicker">TEAMS</span>
            <h2>팀 비교</h2>
          </div>
          <div className="soccer-compare-row">
            <TeamLogo team={f.homeTeam} size={46} radius={12} />
            <div>
              <strong>{teamDisplayName(f.homeTeam)}</strong>
              <span>{f.homeTeam?.city || f.homeTeam?.stadium || '홈 팀'}</span>
            </div>
          </div>
          <div className="soccer-vs-divider">VS</div>
          <div className="soccer-compare-row">
            <TeamLogo team={f.awayTeam} size={46} radius={12} />
            <div>
              <strong>{teamDisplayName(f.awayTeam)}</strong>
              <span>{f.awayTeam?.city || f.awayTeam?.stadium || '원정 팀'}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="soccer-scoreboard-wrap">
        <Scoreboard match={scoreboardMatch} />
      </div>

      <section id="soccer-analysis" className="soccer-analysis-wrap">
        <AiAnalysisCard
          matchStatus={f.status}
          analysis={analysis}
          onGenerate={handleGenerate}
          onRegenerate={handleRegenerate}
          generating={generating}
        />
      </section>

      {f.thumbnailUrl && (
        <section className="soccer-thumbnail-card">
          <div className="soccer-section-head">
            <span className="section-kicker">MATCH IMAGE</span>
            <h2>경기 이미지</h2>
          </div>
          <img
            src={f.thumbnailUrl}
            alt="경기 썸네일"
          />
        </section>
      )}
    </div>
  );
}
