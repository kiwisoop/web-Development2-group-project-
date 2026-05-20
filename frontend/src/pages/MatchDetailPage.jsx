import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMatchDetailFull } from '../api/matchApi';
import { getFavoriteTeams, addFavoriteTeam, removeFavoriteTeam } from '../api/favoriteApi';
import { generateMatchAnalysis, regenerateMatchAnalysis } from '../api/analysisApi';
import { getPredictionResult, votePrediction } from '../api/predictionApi';
import { useAuth } from '../hooks/useAuth';
import Scoreboard from '../components/Scoreboard';
import StatCard from '../components/StatCard';
import TimelineItem from '../components/TimelineItem';
import MatchActionPanel from '../components/MatchActionPanel';
import AiAnalysisPreview from '../components/AiAnalysisPreview';
import PredictionPreview from '../components/PredictionPreview';
import ChatBox from '../components/ChatBox';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';
import { getMlbGameDetail } from '../api/mlbApi';
import MlbPlayByPlay from '../components/MlbPlayByPlay';
import MlbStrikeZoneChart from '../components/MlbStrikeZoneChart';
import TabBar from '../components/TabBar';
import MlbLinescoreTable from '../components/MlbLinescoreTable';
import MlbLineupTable from '../components/MlbLineupTable';
import MlbBoxscoreTable from '../components/MlbBoxscoreTable';

const MLB_TABS = ['경기정보', '라인업', '기록', '중계', '존 차트', '채팅'];

export default function MatchDetailPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [loadingTeamId, setLoadingTeamId] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [analysisGenerating, setAnalysisGenerating] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const [prediction, setPrediction] = useState(null);
  const [predictionVoting, setPredictionVoting] = useState(false);

  const [mlbDetail, setMlbDetail] = useState(null);
  const [mlbDetailLoading, setMlbDetailLoading] = useState(false);
  const [mlbDetailError, setMlbDetailError] = useState(null);
  const [activeTab, setActiveTab] = useState('경기정보');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getMatchDetailFull(matchId, controller.signal)
      .then((res) => {
        setData(res.data);
        setAnalysis(res.data.analysis);
      })
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('경기 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [matchId]);

  useEffect(() => {
    if (!isLoggedIn) {
      setFavoriteTeams([]);
      return;
    }
    const controller = new AbortController();
    getFavoriteTeams(controller.signal)
      .then((res) => setFavoriteTeams(res.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, [isLoggedIn]);

  useEffect(() => {
    const controller = new AbortController();
    getPredictionResult(matchId, controller.signal)
      .then((res) => setPrediction(res.data.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, [matchId, isLoggedIn]);

  useEffect(() => {
    if (!data) return;
    const match = data.match;
    if (match.sportType !== 'BASEBALL' || match.league?.leagueName !== 'MLB') return;

    const controller = new AbortController();
    setMlbDetailLoading(true);
    setMlbDetailError(null);
    getMlbGameDetail(matchId, controller.signal)
      .then(res => setMlbDetail(res.data))
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setMlbDetailError('MLB 상세 데이터를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setMlbDetailLoading(false);
      });
    return () => controller.abort();
  }, [matchId, data]);

  const handleToggleFavorite = async (teamId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setLoadingTeamId(teamId);
    try {
      const existing = favoriteTeams.find((f) => f.teamId === teamId);
      if (existing) {
        await removeFavoriteTeam(existing.id);
        setFavoriteTeams((prev) => prev.filter((f) => f.teamId !== teamId));
      } else {
        const res = await addFavoriteTeam(teamId);
        setFavoriteTeams((prev) => [...prev, res.data.favorite]);
      }
    } catch {
      // non-critical
    } finally {
      setLoadingTeamId(null);
    }
  };

  const handleGenerate = async () => {
    setAnalysisGenerating(true);
    setAnalysisError(null);
    try {
      const res = await generateMatchAnalysis(matchId);
      setAnalysis(res.data);
    } catch {
      setAnalysisError('분석 생성 중 오류가 발생했습니다.');
    } finally {
      setAnalysisGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setAnalysisGenerating(true);
    setAnalysisError(null);
    try {
      const res = await regenerateMatchAnalysis(matchId);
      setAnalysis(res.data);
    } catch {
      setAnalysisError('분석 재생성 중 오류가 발생했습니다.');
    } finally {
      setAnalysisGenerating(false);
    }
  };

  const handleVote = async (voteOption) => {
    if (!isLoggedIn) return;
    setPredictionVoting(true);
    try {
      const res = await votePrediction(matchId, voteOption);
      setPrediction(res.data.data);
    } catch {
      // silently fail — button re-enables via finally
    } finally {
      setPredictionVoting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (error) return (
    <div className="match-detail-page">
      <Link to="/matches" className="back-link">← 경기 목록으로</Link>
      <ErrorBox message={error} />
    </div>
  );

  if (!data) return (
    <div className="match-detail-page">
      <Link to="/matches" className="back-link">← 경기 목록으로</Link>
      <EmptyState title="경기를 찾을 수 없습니다" description="목록으로 돌아가서 다시 시도해 보세요." />
    </div>
  );

  const { match, stats, events } = data;
  const showData = match.status === 'LIVE' || match.status === 'FINAL';
  const favoriteTeamIds = new Set(favoriteTeams.map((f) => f.teamId));
  const isMlb = match.sportType === 'BASEBALL' && match.league?.leagueName === 'MLB';

  const chatDisabledReason =
    match.status === 'LIVE' ? null
    : match.status === 'FINAL' ? '경기 종료 후에는 채팅을 작성할 수 없습니다.'
    : match.status === 'CANCELED' ? '취소된 경기에서는 채팅을 작성할 수 없습니다.'
    : '경기 시작 전에는 채팅을 작성할 수 없습니다.';

  return (
    <div className="match-detail-page">
      <Link to="/matches" className="back-link">← 경기 목록으로</Link>

      <Scoreboard match={match} />

      {isMlb ? (
        <>
          <div className="card mlb-tab-summary">
            {mlbDetailLoading && (
              <div style={{ color: 'var(--color-text-muted)' }}>MLB 데이터 불러오는 중...</div>
            )}
            {mlbDetailError && (
              <div style={{ color: 'var(--color-error)' }}>{mlbDetailError}</div>
            )}
            {mlbDetail && (
              <>
                {(mlbDetail.homeProbablePitcher !== '-' || mlbDetail.awayProbablePitcher !== '-') && (
                  <div className="mlb-pitchers-row">
                    <div className="mlb-pitcher-item">
                      {mlbDetail.homeTeamLogoUrl && (
                        <img className="mlb-pitcher-logo" src={mlbDetail.homeTeamLogoUrl} alt={mlbDetail.homeTeamShortName} />
                      )}
                      <div>
                        <div className="mlb-pitcher-team">{mlbDetail.homeTeamShortName || mlbDetail.homeTeamName}</div>
                        <div className="mlb-pitcher-name">{mlbDetail.homeProbablePitcher}</div>
                      </div>
                    </div>
                    <div className="mlb-pitcher-vs">VS</div>
                    <div className="mlb-pitcher-item mlb-pitcher-item--away">
                      <div>
                        <div className="mlb-pitcher-team mlb-pitcher-team--right">{mlbDetail.awayTeamShortName || mlbDetail.awayTeamName}</div>
                        <div className="mlb-pitcher-name mlb-pitcher-name--right">{mlbDetail.awayProbablePitcher}</div>
                      </div>
                      {mlbDetail.awayTeamLogoUrl && (
                        <img className="mlb-pitcher-logo" src={mlbDetail.awayTeamLogoUrl} alt={mlbDetail.awayTeamShortName} />
                      )}
                    </div>
                  </div>
                )}
                {mlbDetail.linescore && (
                  <MlbLinescoreTable
                    linescore={mlbDetail.linescore}
                    homeShortName={mlbDetail.homeTeamShortName || mlbDetail.homeTeamName}
                    awayShortName={mlbDetail.awayTeamShortName || mlbDetail.awayTeamName}
                  />
                )}
              </>
            )}
          </div>

          <TabBar tabs={MLB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="tab-panel">
            {activeTab === '경기정보' && (
              <>
                {match.status === 'SCHEDULED' && (
                  <div className="status-notice card">경기 시작 전입니다.</div>
                )}
                {match.status === 'CANCELED' && (
                  <div className="status-notice card">이 경기는 취소되었습니다.</div>
                )}
                <MatchActionPanel
                  match={match}
                  isLoggedIn={isLoggedIn}
                  favoriteTeamIds={favoriteTeamIds}
                  onToggleFavorite={handleToggleFavorite}
                  loadingTeamId={loadingTeamId}
                />
                {analysisError && <ErrorBox message={analysisError} />}
                <AiAnalysisPreview
                  matchStatus={match.status}
                  analysis={analysis}
                  onGenerate={handleGenerate}
                  onRegenerate={handleRegenerate}
                  generating={analysisGenerating}
                />
                <PredictionPreview
                  matchStatus={match.status}
                  prediction={prediction}
                  isLoggedIn={isLoggedIn}
                  onVote={handleVote}
                  voting={predictionVoting}
                />
              </>
            )}

            {activeTab === '라인업' && (
              <div className="card">
                <h3 className="detail-section-title">라인업</h3>
                {!mlbDetail ? (
                  <div style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>MLB 데이터를 불러오는 중...</div>
                ) : (
                  <div className="mlb-lineup-grid">
                    <MlbLineupTable
                      lineup={mlbDetail.awayLineup}
                      title={mlbDetail.awayTeamShortName || mlbDetail.awayTeamName}
                    />
                    <MlbLineupTable
                      lineup={mlbDetail.homeLineup}
                      title={mlbDetail.homeTeamShortName || mlbDetail.homeTeamName}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === '기록' && (
              <div className="card">
                <h3 className="detail-section-title">박스스코어</h3>
                {!mlbDetail ? (
                  <div style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>MLB 데이터를 불러오는 중...</div>
                ) : (
                  <MlbBoxscoreTable
                    homeBatters={mlbDetail.homeBatters}
                    awayBatters={mlbDetail.awayBatters}
                    homePitchers={mlbDetail.homePitchers}
                    awayPitchers={mlbDetail.awayPitchers}
                    homeTeamName={mlbDetail.homeTeamShortName || mlbDetail.homeTeamName}
                    awayTeamName={mlbDetail.awayTeamShortName || mlbDetail.awayTeamName}
                  />
                )}
              </div>
            )}

            {activeTab === '중계' && (
              <MlbPlayByPlay matchId={matchId} isLive={match.status === 'LIVE'} />
            )}

            {activeTab === '존 차트' && (
              <MlbStrikeZoneChart matchId={matchId} />
            )}

            {activeTab === '채팅' && (
              <div className="detail-section">
                <h2 className="detail-section-title">경기 채팅방</h2>
                <ChatBox
                  mode="match"
                  matchId={matchId}
                  isLoggedIn={isLoggedIn}
                  disabledReason={chatDisabledReason}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {match.status === 'SCHEDULED' && (
            <div className="status-notice card">경기 시작 전입니다.</div>
          )}
          {match.status === 'CANCELED' && (
            <div className="status-notice card">이 경기는 취소되었습니다.</div>
          )}

          <MatchActionPanel
            match={match}
            isLoggedIn={isLoggedIn}
            favoriteTeamIds={favoriteTeamIds}
            onToggleFavorite={handleToggleFavorite}
            loadingTeamId={loadingTeamId}
          />

          {analysisError && <ErrorBox message={analysisError} />}

          <AiAnalysisPreview
            matchStatus={match.status}
            analysis={analysis}
            onGenerate={handleGenerate}
            onRegenerate={handleRegenerate}
            generating={analysisGenerating}
          />

          <PredictionPreview
            matchStatus={match.status}
            prediction={prediction}
            isLoggedIn={isLoggedIn}
            onVote={handleVote}
            voting={predictionVoting}
          />

          {showData && stats && stats.length > 0 && (
            <div className="detail-section">
              <h2 className="detail-section-title">경기 통계</h2>
              <div className="stats-grid">
                {stats.map((stat) => (
                  <StatCard key={stat.id} stat={stat} />
                ))}
              </div>
            </div>
          )}

          {showData && events && events.length > 0 && (
            <div className="detail-section">
              <h2 className="detail-section-title">이벤트 타임라인</h2>
              <div className="timeline">
                {events.map((event) => (
                  <TimelineItem key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h2 className="detail-section-title">경기 채팅방</h2>
            <ChatBox
              mode="match"
              matchId={matchId}
              isLoggedIn={isLoggedIn}
              disabledReason={chatDisabledReason}
            />
          </div>
        </>
      )}
    </div>
  );
}
