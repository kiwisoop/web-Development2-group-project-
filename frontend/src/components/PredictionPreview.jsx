function VoteButton({ option, label, count, percent, myVote, disabled, onVote }) {
  const isSelected = myVote === option;
  return (
    <div className={`vote-option${isSelected ? ' vote-selected' : ''}`}>
      <button
        className={`btn vote-button${isSelected ? ' btn-primary' : ' btn-outline'}`}
        onClick={() => onVote(option)}
        disabled={disabled}
      >
        {label}
      </button>
      <div className="vote-bar-wrap">
        <div className="vote-bar" style={{ width: `${percent}%` }} />
      </div>
      <span className="vote-percent">{percent}%</span>
      <span className="vote-count">({count}표)</span>
    </div>
  );
}

export default function PredictionPreview({ matchStatus, prediction, isLoggedIn, onVote, voting }) {
  if (!prediction) return null;

  const {
    homeWinCount, drawCount, awayWinCount,
    homeWinPercent, drawPercent, awayWinPercent,
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
            option="HOME_WIN" label="홈 승"
            count={homeWinCount} percent={homeWinPercent}
            myVote={myVote} disabled={disabled} onVote={onVote}
          />
          <VoteButton
            option="DRAW" label="무승부"
            count={drawCount} percent={drawPercent}
            myVote={myVote} disabled={disabled} onVote={onVote}
          />
          <VoteButton
            option="AWAY_WIN" label="원정 승"
            count={awayWinCount} percent={awayWinPercent}
            myVote={myVote} disabled={disabled} onVote={onVote}
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
