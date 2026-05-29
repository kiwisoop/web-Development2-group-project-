import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRecommendedTeams } from '../hooks/useRecommendedTeams';
import { recommendedTeamsMock } from '../data/recommendedTeamsMock';
import { getMatchSections } from '../api/matchApi';
import RecommendedTeamCard from './RecommendedTeamCard';
import './RecommendedTeamSection.css';

function findMatchIdForTeam(team, matches) {
  if (!team?.teamName || matches.length === 0) return null;

  const teamName = team.teamName;
  const opponent = team.nextMatch?.opponent;

  const candidates = matches.filter(
    (m) => m.homeTeam?.teamName === teamName || m.awayTeam?.teamName === teamName,
  );
  if (candidates.length === 0) return null;

  if (opponent) {
    const exact = candidates.find((m) => {
      const other = m.homeTeam?.teamName === teamName ? m.awayTeam?.teamName : m.homeTeam?.teamName;
      return other === opponent;
    });
    if (exact) return exact.id;
  }

  return candidates[0].id;
}

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

  // 추천팀 카드의 "분석 보기" 버튼을 활성화하기 위해 경기 목록을 함께 가져온다.
  // 추천팀 API/mock 응답에는 matchId 가 없어, teamName + opponent 매칭으로 보강한다.
  const [allMatches, setAllMatches] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    getMatchSections({}, controller.signal)
      .then((res) => {
        const { liveMatches = [], recentFinishedMatches = [], upcomingMatches = [] } = res.data ?? {};
        setAllMatches([...liveMatches, ...recentFinishedMatches, ...upcomingMatches]);
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setAllMatches([]);
      });
    return () => controller.abort();
  }, []);

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

  // 경기 목록에서 매칭되는 경기를 찾아 matchId 를 보강한다.
  // 못 찾은 팀은 matchId 가 없어 카드 버튼이 disabled 로 유지된다(기존 동작과 호환).
  const enrichedTeams = useMemo(
    () =>
      displayTeams.map((t) => {
        if (t.matchId || t.nextMatch?.matchId) return t;
        const matchId = findMatchIdForTeam(t, allMatches);
        return matchId ? { ...t, matchId } : t;
      }),
    [displayTeams, allMatches],
  );

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
        {enrichedTeams.map((team) => (
          <RecommendedTeamCard key={team.id} team={team} />
        ))}
      </div>
    );
  };

  return (
    <section className="rec-section">
      <div className="rec-head">
        <div className="rec-head-text">
          <h2 className="section-title">내 추천팀 맞춤 분석</h2>
          <p className="rec-section-desc">
            관심팀 기준으로 다음 경기, 최근 흐름, 분석 가능 여부를 우선 보여줍니다.
          </p>
        </div>
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
