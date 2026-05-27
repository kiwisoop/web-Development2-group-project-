import { useNavigate } from 'react-router-dom';

const STATUS_LABEL = {
  READY: '분석 완료',
  IN_PROGRESS: '분석 중',
  PENDING: '분석 대기',
};

const STATUS_CLASS = {
  READY: 'rec-status--ready',
  IN_PROGRESS: 'rec-status--progress',
  PENDING: 'rec-status--pending',
};

const FORM_CLASS = {
  승: 'form-win',
  무: 'form-draw',
  패: 'form-loss',
};

export default function RecommendedTeamCard({ team }) {
  const {
    teamName,
    sportLabel,
    league,
    ranking,
    nextMatch,
    analysisStatus,
    recentForm = [],
    aiInsight,
    keyPoint,
    riskFactor,
    alerts = [],
  } = team;

  const navigate = useNavigate();
  const matchId = team.matchId ?? nextMatch?.matchId;
  const handleAnalysisClick = () => {
    if (!matchId) return;
    navigate(`/matches/${matchId}`);
  };

  return (
    <article className="rec-card">
      <div className="rec-card-top">
        <span className="rec-sport">{sportLabel}</span>
        <span className="rec-divider">·</span>
        <span className="rec-league">{league}</span>
        <span className={`rec-status ${STATUS_CLASS[analysisStatus]}`}>
          {STATUS_LABEL[analysisStatus] ?? analysisStatus}
        </span>
      </div>

      <div className="rec-team-head">
        <h3 className="rec-team-name">{teamName}</h3>
        <span className="rec-ranking">{ranking}</span>
      </div>

      <div className="rec-next-match">
        <span className="rec-next-label">다음 경기</span>
        <span className="rec-next-opponent">vs {nextMatch.opponent}</span>
        <span className="rec-next-time">{nextMatch.dateTime}</span>
      </div>

      <div className="form-comparison">
        <div className="form-comparison-title">최근 5경기</div>
        <div className="form-row">
          <span className="form-team-name">{teamName}</span>
          <div className="form-badges">
            {recentForm.map((r, i) => (
              <span key={i} className={`form-badge ${FORM_CLASS[r]}`}>
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="rec-insight">{aiInsight}</p>

      <dl className="rec-detail-list">
        <div className="rec-detail">
          <dt>핵심 포인트</dt>
          <dd>{keyPoint}</dd>
        </div>
        <div className="rec-detail rec-detail--risk">
          <dt>리스크 요인</dt>
          <dd>{riskFactor}</dd>
        </div>
      </dl>

      {alerts.length > 0 && (
        <ul className="rec-alerts">
          {alerts.map((alert, i) => (
            <li key={i} className="rec-alert">
              {alert}
            </li>
          ))}
        </ul>
      )}

      <div className="rec-card-footer">
        <button
          type="button"
          className="rec-analysis-btn"
          onClick={handleAnalysisClick}
          disabled={!matchId}
        >
          분석 보기
        </button>
      </div>
    </article>
  );
}
