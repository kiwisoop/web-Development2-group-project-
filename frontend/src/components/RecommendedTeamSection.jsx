import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRecommendedTeams } from '../hooks/useRecommendedTeams';
import { recommendedTeamsMock } from '../data/recommendedTeamsMock';
import RecommendedTeamCard from './RecommendedTeamCard';
import './RecommendedTeamSection.css';

// 데모 컨트롤(상태 전환 버튼)은 기본적으로 숨깁니다.
// 개발 중 세 가지 상태를 직접 확인할 때만 true 로 바꿔 사용하세요.
// 실제 사용자에게는 절대 노출되지 않습니다 (DEV 빌드에서만 렌더링).
const showDemoControls = false;

const STATE = {
  GUEST: 'guest', // 비로그인
  EMPTY: 'empty', // 로그인했지만 추천팀 없음
  FILLED: 'filled', // 추천팀 있음
};

function CtaBanner({ title, description, buttonLabel, onClick }) {
  return (
    <div className="rec-cta">
      <div className="rec-cta-icon" aria-hidden="true">
        ⭐
      </div>
      <div className="rec-cta-body">
        <p className="rec-cta-title">{title}</p>
        <p className="rec-cta-desc">{description}</p>
      </div>
      <div className="rec-cta-action">
        <button type="button" className="btn btn-primary rec-cta-btn" onClick={onClick}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export default function RecommendedTeamSection() {
  const { isLoggedIn } = useAuth();
  const { teams, loading } = useRecommendedTeams(isLoggedIn);
  const navigate = useNavigate();

  // 데모 강제 상태 (null 이면 실제 로그인/데이터 상태를 따름)
  const [demoState, setDemoState] = useState(null);

  // 실제 상태 계산
  let effectiveState;
  if (!isLoggedIn) effectiveState = STATE.GUEST;
  else if (teams.length === 0) effectiveState = STATE.EMPTY;
  else effectiveState = STATE.FILLED;

  // 데모 강제 상태가 지정되어 있으면 우선 적용
  if (demoState) effectiveState = demoState;

  // FILLED 상태에서 보여줄 팀 목록 (데모로 강제한 경우 mock 사용)
  const displayTeams =
    effectiveState === STATE.FILLED
      ? teams.length > 0
        ? teams
        : recommendedTeamsMock
      : [];

  const renderBody = () => {
    if (effectiveState === STATE.GUEST) {
      return (
        <CtaBanner
          title="추천팀을 설정하고 맞춤 경기 분석을 받아보세요."
          description="내 팀 경기 우선 표시, 분석 완료 알림, 최근 흐름 요약을 제공합니다."
          buttonLabel="로그인하고 추천팀 설정하기"
          onClick={() => navigate('/login')}
        />
      );
    }

    if (effectiveState === STATE.EMPTY) {
      return (
        <CtaBanner
          title="아직 추천팀이 설정되지 않았어요."
          description="좋아하는 팀을 선택하면 홈에서 맞춤 분석을 볼 수 있습니다."
          buttonLabel="추천팀 설정하기"
          onClick={() => navigate('/favorites')}
        />
      );
    }

    // FILLED
    return (
      <div className="rec-grid">
        {displayTeams.map((team) => (
          <RecommendedTeamCard key={team.id} team={team} />
        ))}
      </div>
    );
  };

  return (
    <section className="rec-section">
      <div className="rec-head">
        <h2 className="section-title">내 추천팀 맞춤 분석</h2>
        {showDemoControls && import.meta.env.DEV && (
          <div className="rec-demo-controls">
            <span className="rec-demo-label">데모 상태:</span>
            <button type="button" onClick={() => setDemoState(null)}>
              실제
            </button>
            <button type="button" onClick={() => setDemoState(STATE.GUEST)}>
              비로그인
            </button>
            <button type="button" onClick={() => setDemoState(STATE.EMPTY)}>
              추천팀 없음
            </button>
            <button type="button" onClick={() => setDemoState(STATE.FILLED)}>
              추천팀 있음
            </button>
          </div>
        )}
      </div>

      {/* 로그인 상태에서 데이터 로딩 중이고 데모 강제 상태가 아닐 때만 로딩 표시 */}
      {loading && !demoState && isLoggedIn ? (
        <p className="rec-loading">맞춤 분석을 불러오는 중...</p>
      ) : (
        renderBody()
      )}
    </section>
  );
}
