import { useState } from 'react';

const DEFAULT_HOME_COLOR = '#3b82f6';
const DEFAULT_AWAY_COLOR = '#ef4444';

function TeamLogo({ logoUrl, teamName, size = 36 }) {
  const [err, setErr] = useState(false);
  if (!logoUrl || err) {
    return (
      <span
        className="vote-team-logo-fallback"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {(teamName || '?').slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={logoUrl}
      alt={teamName}
      width={size}
      height={size}
      className="vote-team-logo-img"
      onError={() => setErr(true)}
    />
  );
}

function VoteButton({ option, team, defaultColor, count, percent, myVote, disabled, onVote }) {
  const isSelected = myVote === option;
  const color = team?.teamColor || defaultColor;
  const teamName = team?.teamName || (option === 'HOME_WIN' ? '홈팀' : '원정팀');
  const logoUrl = team?.logoUrl;

  return (
    <div className={`vote-option${isSelected ? ' vote-selected' : ''}`}>
      <div className="vote-team-header">
        <TeamLogo logoUrl={logoUrl} teamName={teamName} size={36} />
        <span className="vote-team-label" style={{ color }}>{teamName}</span>
      </div>
      <button
        className="btn vote-button"
        style={
          isSelected
            ? { background: color, borderColor: color, color: '#fff' }
            : { background: 'transparent', borderColor: color, color }
        }
        onClick={() => onVote(option)}
        disabled={disabled}
      >
        {isSelected ? '✓ 선택됨' : '승리 예측'}
      </button>
      <div className="vote-bar-wrap">
        <div className="vote-bar" style={{ width: `${percent}%`, background: color }} />
      </div>
      <span className="vote-percent" style={isSelected ? { color } : {}}>{percent}%</span>
      <span className="vote-count">({count}표)</span>
    </div>
  );
}

export default function PredictionPreview({ matchStatus, prediction, isLoggedIn, onVote, voting, homeTeam, awayTeam }) {
  if (!prediction) return null;

  const {
    homeWinCount, awayWinCount,
    homeWinPercent, awayWinPercent,
    totalVotes, myVote, canVote,
  } = prediction;

  const isFinal = matchStatus === 'FINAL';
  const disabled = voting || !isLoggedIn || !canVote;

  return (
    <div className="detail-section">
      <h2 className="detail-section-title">팬 승부 예측</h2>
      <div className="prediction-card card">
        <div className="vote-options">
          <VoteButton
            option="HOME_WIN"
            team={homeTeam}
            defaultColor={DEFAULT_HOME_COLOR}
            count={homeWinCount}
            percent={homeWinPercent}
            myVote={myVote}
            disabled={disabled}
            onVote={onVote}
          />
          <VoteButton
            option="AWAY_WIN"
            team={awayTeam}
            defaultColor={DEFAULT_AWAY_COLOR}
            count={awayWinCount}
            percent={awayWinPercent}
            myVote={myVote}
            disabled={disabled}
            onVote={onVote}
          />
        </div>
        <p className="vote-total">총 {totalVotes}명이 참여했습니다.</p>
        <p className="vote-notice">이 결과는 AI 예측이 아니라 팬 투표 비율입니다.</p>
        {totalVotes <= 1 && (
          <p className="vote-notice">아직 투표 수가 적어 참고용으로만 확인해 주세요.</p>
        )}
        {!isLoggedIn && (
          <p className="notice-text">로그인 후 예측 투표에 참여할 수 있습니다.</p>
        )}
        {isLoggedIn && isFinal && (
          <p className="notice-text">경기 종료 후에는 투표할 수 없습니다.</p>
        )}
      </div>
    </div>
  );
}
