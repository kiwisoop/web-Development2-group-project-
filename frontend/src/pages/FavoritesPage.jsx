import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFavoriteTeams, addFavoriteTeam, removeFavoriteTeam } from '../api/favoriteApi';
import { getRankings } from '../api/rankingApi';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';

const SPORT_LABELS = {
  SOCCER: '⚽ 축구',
  BASEBALL: '⚾ 야구',
  ESPORTS: '🎮 E스포츠',
};

const TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'BASEBALL', label: '야구' },
  { key: 'SOCCER', label: '축구' },
  { key: 'ESPORTS', label: 'E스포츠' },
];

// 야구 리그 필터 (야구 탭에서만 노출). leagueName 부분일치로 매칭한다. (예: "KBO 리그")
const LEAGUE_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'MLB', label: 'MLB' },
  { key: 'KBO', label: 'KBO 리그' },
];

// 종목별 카드 라벨 + 전적 표기 방식(축구만 무승부 표시).
const SPORT_CARD = {
  BASEBALL: { label: '⚾ 야구',    showDraws: false },
  SOCCER:   { label: '⚽ 축구',    showDraws: true },
  ESPORTS:  { label: '🎮 E스포츠', showDraws: false },
};

// 카드 메타: 순위/전적/승률 데이터가 있으면 표시, 없으면 안전한 문구(가짜 수치 없음).
function teamMeta(team, showDraws) {
  if (team.gamesPlayed > 0) {
    const record = showDraws
      ? `${team.wins}승 ${team.draws}무 ${team.losses}패`
      : `${team.wins}승 ${team.losses}패`;
    return `${team.rank}위 · ${record} · 승률 ${team.winRate}%`;
  }
  return '최근 데이터 확인 중';
}

// 리그 필터 키와 leagueName 매칭 (대소문자 무시, 부분일치)
function leagueMatches(leagueName, filterKey) {
  if (filterKey === 'ALL') return true;
  return (leagueName || '').toUpperCase().includes(filterKey);
}

// 팀 로고. logoUrl 이 있으면 이미지를, 없거나 로드 실패 시 팀명 첫 글자 폴백을 표시한다.
function TeamLogo({ name, logoUrl, size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  if (logoUrl && !failed) {
    return (
      <img
        className={`team-logo team-logo--${size}`}
        src={logoUrl}
        alt={`${name} 로고`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className={`team-logo team-logo--${size} team-logo--fallback`} aria-hidden="true">
      {initial}
    </span>
  );
}

export default function FavoritesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [baseballTeams, setBaseballTeams] = useState([]);
  const [soccerTeams, setSoccerTeams] = useState([]);
  const [esportsTeams, setEsportsTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [leagueFilter, setLeagueFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingTeamId, setTogglingTeamId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    // 즐겨찾기 + 종목별 팀 목록(랭킹 API)을 함께 불러온다.
    // 즐겨찾기·야구는 핵심(실패 시 에러), 축구·E스포츠는 실패해도 빈 목록으로 처리(페이지 유지).
    Promise.allSettled([
      getFavoriteTeams(controller.signal),
      getRankings('BASEBALL', controller.signal),
      getRankings('SOCCER', controller.signal),
      getRankings('ESPORTS', controller.signal),
    ])
      .then(([favRes, bbRes, socRes, espRes]) => {
        if (controller.signal.aborted) return;
        if (favRes.status === 'fulfilled' && bbRes.status === 'fulfilled') {
          setFavorites(favRes.value.data ?? []);
          // 랭킹 API는 ApiResponse 래퍼 → res.data.data 가 실제 배열
          setBaseballTeams(bbRes.value.data?.data ?? []);
        } else {
          setError('관심 팀 정보를 불러오지 못했습니다.');
        }
        setSoccerTeams(socRes.status === 'fulfilled' ? (socRes.value.data?.data ?? []) : []);
        setEsportsTeams(espRes.status === 'fulfilled' ? (espRes.value.data?.data ?? []) : []);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [isLoggedIn, authLoading]);

  const findFavorite = useCallback(
    (teamId) => favorites.find((f) => f.teamId === teamId),
    [favorites],
  );

  // 팀 토글(종목 공용): 미선택이면 추가(POST), 선택됨이면 해제(DELETE). 백엔드 즐겨찾기 API 사용.
  const handleToggleTeam = async (team) => {
    const existing = findFavorite(team.teamId);
    setTogglingTeamId(team.teamId);
    try {
      if (existing) {
        await removeFavoriteTeam(existing.id);
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      } else {
        const res = await addFavoriteTeam(team.teamId);
        const saved = res.data?.favorite;
        if (saved) setFavorites((prev) => [...prev, saved]);
      }
    } catch {
      // 실패 시 무시 — 새로고침으로 재시도 가능
    } finally {
      setTogglingTeamId(null);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    setRemovingId(favoriteId);
    try {
      await removeFavoriteTeam(favoriteId);
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch {
      // 실패 시 무시
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || loading) return <LoadingState />;

  // 공통 헤더 (조건 1)
  const header = (
    <div className="fav-head">
      <h1 className="page-title">관심 팀 설정</h1>
      <p className="fav-intro-desc">좋아하는 팀을 선택하면 홈에서 맞춤 경기 분석을 볼 수 있습니다.</p>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="favorites-page">
        {header}
        <div className="login-notice card">
          <p>로그인 후 관심 팀을 설정할 수 있습니다.</p>
          <Link to="/login" className="btn btn-primary">로그인하기</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-page">
        {header}
        <ErrorBox message={error} />
      </div>
    );
  }

  const showBaseball = activeTab === 'ALL' || activeTab === 'BASEBALL';
  const showSoccer = activeTab === 'ALL' || activeTab === 'SOCCER';
  const showEsports = activeTab === 'ALL' || activeTab === 'ESPORTS';

  const query = search.trim().toLowerCase();
  const matchName = (name) => !query || (name || '').toLowerCase().includes(query);

  // 야구 팀: 검색 → (야구 탭일 때만) 리그 필터 → 선택된 팀 우선 정렬
  let baseballList = baseballTeams.filter((t) => matchName(t.teamName));
  if (activeTab === 'BASEBALL') {
    baseballList = baseballList.filter((t) => leagueMatches(t.leagueName, leagueFilter));
  }
  baseballList = baseballList
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const sa = findFavorite(a.t.teamId) ? 1 : 0;
      const sb = findFavorite(b.t.teamId) ? 1 : 0;
      if (sa !== sb) return sb - sa; // 선택된 팀(1) 먼저
      return a.i - b.i; // 그 외에는 기존 순위 순서 유지(안정 정렬)
    })
    .map((x) => x.t);

  // 검색 필터 + 선택된 팀 우선 정렬(야구와 동일 규칙). 종목 공용.
  const buildTeamList = (teams) =>
    teams
      .filter((t) => matchName(t.teamName))
      .map((t, i) => ({ t, i }))
      .sort((a, b) => {
        const sa = findFavorite(a.t.teamId) ? 1 : 0;
        const sb = findFavorite(b.t.teamId) ? 1 : 0;
        if (sa !== sb) return sb - sa;
        return a.i - b.i;
      })
      .map((x) => x.t);

  const soccerList = buildTeamList(soccerTeams);
  const esportsList = buildTeamList(esportsTeams);

  const visibleCount =
    (showBaseball ? baseballList.length : 0) +
    (showSoccer ? soccerList.length : 0) +
    (showEsports ? esportsList.length : 0);

  // 종목 공용 팀 카드(야구와 동일 레이아웃/버튼/로고 폴백). sportType에 따라 라벨·전적 표기만 달라진다.
  const renderTeamCard = (team, sportType) => {
    const cfg = SPORT_CARD[sportType];
    const selected = !!findFavorite(team.teamId);
    const busy = togglingTeamId === team.teamId;
    return (
      <article key={`${sportType}-${team.teamId}`} className="team-select-card card">
        <div className="tsc-top">
          <span className="tsc-sport">{cfg.label}</span>
          <span className="tsc-league">{team.leagueName || '리그 정보 없음'}</span>
        </div>
        <div className="tsc-name-row">
          <TeamLogo name={team.teamName} logoUrl={team.logoUrl} />
          <p className="tsc-team-name">{team.teamName}</p>
        </div>
        <p className="tsc-meta">{teamMeta(team, cfg.showDraws)}</p>
        <button
          type="button"
          className={`btn btn-sm tsc-btn ${selected ? 'btn-outline' : 'btn-primary'}`}
          onClick={() => handleToggleTeam(team)}
          disabled={busy}
        >
          {busy ? '처리 중...' : selected ? '✓ 선택됨' : '관심팀 추가'}
        </button>
      </article>
    );
  };

  return (
    <div className="favorites-page">
      {header}

      {/* 내 관심팀 영역 (조건 7 + 개수 표시 조건 4) */}
      <section className="my-fav-area card">
        <h2 className="my-fav-title">
          내 관심팀
          {favorites.length > 0 && <span className="my-fav-count">{favorites.length}개</span>}
        </h2>
        {favorites.length === 0 ? (
          <p className="my-fav-empty">아직 선택한 관심팀이 없습니다. 아래에서 팀을 선택해 보세요.</p>
        ) : (
          <div className="my-fav-chips">
            {favorites.map((fav) => (
              <span key={fav.id} className="my-fav-chip">
                <TeamLogo name={fav.teamName} logoUrl={fav.team?.logoUrl} size="sm" />
                <span className="my-fav-chip-label">
                  {SPORT_LABELS[fav.sportType] || fav.sportType} {fav.teamName}
                </span>
                <button
                  type="button"
                  className="my-fav-chip-remove"
                  onClick={() => handleRemoveFavorite(fav.id)}
                  disabled={removingId === fav.id}
                  aria-label={`${fav.teamName} 관심팀 해제`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 종목 탭 (조건 2 - 기존) */}
      <div className="fav-tabs" role="tablist" aria-label="종목 선택">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`fav-tab${activeTab === tab.key ? ' fav-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 검색창 + (야구 탭) 리그 필터 */}
      <div className="fav-controls">
        <input
          type="text"
          className="fav-search-input"
          placeholder="팀 이름 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="팀 이름 검색"
        />
        {activeTab === 'BASEBALL' && (
          <div className="fav-league-filter" role="group" aria-label="야구 리그 필터">
            {LEAGUE_FILTERS.map((lf) => (
              <button
                key={lf.key}
                type="button"
                className={`league-pill${leagueFilter === lf.key ? ' league-pill--active' : ''}`}
                onClick={() => setLeagueFilter(lf.key)}
              >
                {lf.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 팀 목록 */}
      {visibleCount === 0 ? (
        <EmptyState
          title={query ? '검색 결과가 없습니다' : '표시할 팀 데이터가 없습니다.'}
          description={query ? '다른 팀 이름으로 검색해 보세요.' : '연결된 실제 팀 데이터가 없습니다.'}
        />
      ) : (
        <div className="team-select-grid">
          {showBaseball && baseballList.map((t) => renderTeamCard(t, 'BASEBALL'))}
          {showSoccer && soccerList.map((t) => renderTeamCard(t, 'SOCCER'))}
          {showEsports && esportsList.map((t) => renderTeamCard(t, 'ESPORTS'))}
        </div>
      )}
    </div>
  );
}
