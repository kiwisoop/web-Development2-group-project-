import { useState, useEffect } from 'react';
import { getMlbAnalysis } from '../api/mlbApi';
import LoadingState from './LoadingState';
import ErrorBox from './ErrorBox';

export default function MlbAnalysisTab({ matchId, homeTeam = '홈', awayTeam = '원정' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getMlbAnalysis(matchId, controller.signal)
      .then(res => setData(res.data))
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('분석 데이터를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [matchId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const { winProbability, homePitcher, awayPitcher, keyBatters, inningFlow, summary, tactical, keyPoint } = data;

  const RANK_COLORS = ['#f59e0b', '#94a3b8', '#b45309'];

  return (
    <div className="mlb-analysis-tab">

      {/* 승률 예측 */}
      {winProbability && (
        <div className="card analysis-section-card">
          <div className="analysis-section-header">
            <span className="analysis-section-icon">📊</span>
            <h3 className="detail-section-title" style={{ margin: 0 }}>승률 예측</h3>
          </div>
          <div className="analysis-win-prob">
            <div className="analysis-win-prob-teams">
              <div className="analysis-win-team analysis-win-team--home">
                <span className="analysis-win-team-badge analysis-win-team-badge--home">홈</span>
                <span className="analysis-win-team-name">{homeTeam}</span>
              </div>
              <div className="analysis-win-team analysis-win-team--away">
                <span className="analysis-win-team-name">{awayTeam}</span>
                <span className="analysis-win-team-badge analysis-win-team-badge--away">원정</span>
              </div>
            </div>
            <div className="analysis-win-bar-row">
              <span className="analysis-win-pct analysis-win-pct--home">{winProbability.home}%</span>
              <div className="analysis-win-bar">
                <div className="analysis-win-bar-fill" style={{ width: `${winProbability.home}%` }} />
              </div>
              <span className="analysis-win-pct analysis-win-pct--away">{winProbability.away}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 이닝별 득점 흐름 */}
      {inningFlow && inningFlow.length > 0 && (
        <div className="card analysis-section-card">
          <div className="analysis-section-header">
            <span className="analysis-section-icon">📈</span>
            <h3 className="detail-section-title" style={{ margin: 0 }}>이닝별 득점 흐름</h3>
          </div>
          <div className="analysis-inning-wrap">
            <table className="analysis-inning-table">
              <thead>
                <tr>
                  <th className="analysis-inning-team-col">팀</th>
                  {inningFlow.map(i => <th key={i.inning}>{i.inning}</th>)}
                  <th className="analysis-inning-total-col">합계</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="analysis-inning-team-name">{homeTeam}</td>
                  {inningFlow.map(i => (
                    <td key={i.inning} className={i.home !== '0' && i.home !== 'X' ? 'analysis-inning-score--scored' : ''}>
                      {i.home}
                    </td>
                  ))}
                  <td className="analysis-inning-total">
                    {inningFlow.reduce((sum, i) => sum + (parseInt(i.home) || 0), 0)}
                  </td>
                </tr>
                <tr>
                  <td className="analysis-inning-team-name">{awayTeam}</td>
                  {inningFlow.map(i => (
                    <td key={i.inning} className={i.away !== '0' && i.away !== 'X' ? 'analysis-inning-score--scored' : ''}>
                      {i.away}
                    </td>
                  ))}
                  <td className="analysis-inning-total">
                    {inningFlow.reduce((sum, i) => sum + (parseInt(i.away) || 0), 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 선발 투수 비교 */}
      {(homePitcher || awayPitcher) && (
        <div className="card analysis-section-card">
          <div className="analysis-section-header">
            <span className="analysis-section-icon">⚾</span>
            <h3 className="detail-section-title" style={{ margin: 0 }}>선발 투수 비교</h3>
          </div>
          <div className="analysis-pitcher-grid">
            <div className="analysis-pitcher-card">
              <div className="analysis-pitcher-team">{homeTeam} <span className="analysis-pitcher-role">홈 선발</span></div>
              <div className="analysis-pitcher-name">{homePitcher?.name ?? '-'}</div>
              <div className="analysis-pitcher-stats">
                <div className="analysis-pitcher-stat">
                  <span className="analysis-pitcher-stat-val">{homePitcher?.strikeOuts ?? 0}</span>
                  <span className="analysis-pitcher-stat-label">삼진</span>
                </div>
                <div className="analysis-pitcher-stat">
                  <span className="analysis-pitcher-stat-val">{homePitcher?.baseOnBalls ?? 0}</span>
                  <span className="analysis-pitcher-stat-label">볼넷</span>
                </div>
                <div className="analysis-pitcher-stat">
                  <span className="analysis-pitcher-stat-val">{homePitcher?.numberOfPitches ?? 0}</span>
                  <span className="analysis-pitcher-stat-label">투구수</span>
                </div>
                <div className="analysis-pitcher-stat">
                  <span className="analysis-pitcher-stat-val">{homePitcher?.era ?? '-'}</span>
                  <span className="analysis-pitcher-stat-label">ERA</span>
                </div>
              </div>
            </div>

            <div className="analysis-pitcher-divider">VS</div>

            <div className="analysis-pitcher-card analysis-pitcher-card--away">
              <div className="analysis-pitcher-team">{awayTeam} <span className="analysis-pitcher-role">원정 선발</span></div>
              <div className="analysis-pitcher-name">{awayPitcher?.name ?? '-'}</div>
              <div className="analysis-pitcher-stats">
                <div className="analysis-pitcher-stat">
                  <span className="analysis-pitcher-stat-val">{awayPitcher?.strikeOuts ?? 0}</span>
                  <span className="analysis-pitcher-stat-label">삼진</span>
                </div>
                <div className="analysis-pitcher-stat">
                  <span className="analysis-pitcher-stat-val">{awayPitcher?.baseOnBalls ?? 0}</span>
                  <span className="analysis-pitcher-stat-label">볼넷</span>
                </div>
                <div className="analysis-pitcher-stat">
                  <span className="analysis-pitcher-stat-val">{awayPitcher?.numberOfPitches ?? 0}</span>
                  <span className="analysis-pitcher-stat-label">투구수</span>
                </div>
                <div className="analysis-pitcher-stat">
                  <span className="analysis-pitcher-stat-val">{awayPitcher?.era ?? '-'}</span>
                  <span className="analysis-pitcher-stat-label">ERA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 핵심 타자 */}
      {keyBatters && keyBatters.length > 0 && (
        <div className="card analysis-section-card">
          <div className="analysis-section-header">
            <span className="analysis-section-icon">🏆</span>
            <h3 className="detail-section-title" style={{ margin: 0 }}>핵심 타자 Top {keyBatters.length}</h3>
          </div>
          <div className="analysis-batters">
            {keyBatters.map((b, i) => (
              <div key={`${b.team}-${b.name}`} className="analysis-batter-row">
                <div className="analysis-batter-rank" style={{ background: RANK_COLORS[i] ?? '#94a3b8' }}>
                  {i + 1}
                </div>
                <div className="analysis-batter-info">
                  <span className="analysis-batter-team">{b.team}</span>
                  <span className="analysis-batter-name">{b.name}</span>
                </div>
                <div className="analysis-batter-stats">
                  <span className="analysis-batter-chip">
                    <span className="analysis-batter-chip-val">{b.hits}</span>
                    <span className="analysis-batter-chip-label">안타</span>
                  </span>
                  <span className="analysis-batter-chip analysis-batter-chip--hr">
                    <span className="analysis-batter-chip-val">{b.homeRuns}</span>
                    <span className="analysis-batter-chip-label">홈런</span>
                  </span>
                  <span className="analysis-batter-chip">
                    <span className="analysis-batter-chip-val">{b.rbi}</span>
                    <span className="analysis-batter-chip-label">타점</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 분석 */}
      {(summary || tactical || keyPoint) && (
        <div className="card analysis-section-card">
          <div className="analysis-section-header">
            <span className="analysis-section-icon">🤖</span>
            <h3 className="detail-section-title" style={{ margin: 0 }}>AI 분석</h3>
          </div>
          <div className="analysis-ai-blocks">
            {summary && (
              <div className="analysis-ai-block">
                <div className="analysis-ai-label">경기 요약</div>
                <p className="analysis-ai-text">{summary}</p>
              </div>
            )}
            {tactical && (
              <div className="analysis-ai-block">
                <div className="analysis-ai-label">전술 분석</div>
                <p className="analysis-ai-text">{tactical}</p>
              </div>
            )}
            {keyPoint && (
              <div className="analysis-ai-block analysis-ai-block--highlight">
                <div className="analysis-ai-label">핵심 포인트</div>
                <p className="analysis-ai-text">{keyPoint}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
