import { useState, useEffect, useRef } from 'react';
import {
  getCitoSeasons, getCitoMatches, getCitoStandings, getCitoToday,
  getLckTeamsWithPlayers, getCitoMatchPlayerStats, generateLckMatchAnalysis,
} from '../api/lckApi';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import PlayerStatsModal from '../components/PlayerStatsModal';

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

const POS_ORDER = { TOP: 0, JGL: 1, JNG: 1, JUNGLE: 1, MID: 2, BOT: 3, ADC: 3, SUP: 4, SUPPORT: 4 };
const POS_COLOR = {
  TOP: '#ef4444', JGL: '#22c55e', JNG: '#22c55e', JUNGLE: '#22c55e',
  MID: '#3b82f6', BOT: '#f59e0b', ADC: '#f59e0b', SUP: '#a855f7', SUPPORT: '#a855f7',
};

// ─── 공통 컴포넌트 ─────────────────────────────────────────────────────────────

function TeamLogo({ imageUrl, name, size = 28 }) {
  const [err, setErr] = useState(false);
  if (!imageUrl || err) {
    return (
      <span
        className="esports-logo-fallback"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {(name || '?').slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={imageUrl} alt={name} width={size} height={size}
      className="esports-team-logo" onError={() => setErr(true)}
    />
  );
}

function StateBadge({ state }) {
  if (state === 'completed') return <span className="esports-state-badge done">종료</span>;
  if (state === 'inProgress') return <span className="esports-state-badge live">LIVE</span>;
  return <span className="esports-state-badge upcoming">예정</span>;
}

// ─── Gemini 분석 패널 ─────────────────────────────────────────────────────────

function GeminiAnalysisPanel({ analysis, generating, onGenerate }) {
  if (generating) {
    return (
      <div className="lck-gemini-panel lck-gemini-loading">
        <span className="lck-gemini-spinner" />
        Gemini가 경기를 분석 중입니다... (최대 50초 소요)
      </div>
    );
  }

  if (analysis?.error) {
    return (
      <div className="lck-gemini-panel lck-gemini-error">
        <span className="lck-gemini-error-msg">{analysis.error}</span>
        <button className="btn btn-outline btn-sm" onClick={onGenerate}>다시 시도</button>
      </div>
    );
  }

  if (analysis) {
    return (
      <div className="lck-gemini-panel lck-gemini-done">
        <div className="lck-gemini-header">
          <span className="lck-gemini-badge">Gemini AI 분석</span>
          <button className="btn btn-outline btn-sm" onClick={onGenerate}>재생성</button>
        </div>
        {analysis.summary && (
          <div className="lck-gemini-block">
            <strong>요약</strong>
            <p>{analysis.summary}</p>
          </div>
        )}
        {analysis.tactical && (
          <div className="lck-gemini-block">
            <strong>전술 분석</strong>
            <p>{analysis.tactical}</p>
          </div>
        )}
        {analysis.keyPoint && (
          <div className="lck-gemini-block">
            <strong>핵심 포인트</strong>
            <p>{analysis.keyPoint}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lck-gemini-panel lck-gemini-empty">
      <p className="lck-gemini-desc">선수 KDA·데미지 기여도를 참고해 Gemini AI가 경기 요약을 작성합니다.</p>
      <button className="btn btn-primary" onClick={onGenerate}>AI 경기 요약 생성</button>
    </div>
  );
}

// ─── 선수 KDA 테이블 ──────────────────────────────────────────────────────────

function PlayerStatRow({ p }) {
  const pos = (p.position || '').toUpperCase();
  const color = POS_COLOR[pos] || '#6b7280';
  const kda = p.deaths === 0
    ? ((p.kills + p.assists) / 1).toFixed(1) + ':1'
    : ((p.kills + p.assists) / p.deaths).toFixed(2);
  return (
    <tr>
      <td>
        <span className="lck-pos-badge" style={{ backgroundColor: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 18, borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
          {p.position || '?'}
        </span>
      </td>
      <td className="lck-stat-nick">{p.nickname}</td>
      <td className="lck-stat-champ">{p.champion || '-'}</td>
      <td className="lck-stat-kda">
        <span className="lck-kda-kills">{p.kills}</span>/
        <span className="lck-kda-deaths">{p.deaths}</span>/
        <span className="lck-kda-assists">{p.assists}</span>
      </td>
      <td>{kda}</td>
      <td>
        <div className="lck-dmg-bar-wrap">
          <div className="lck-dmg-bar" style={{ width: `${Math.min(p.damageShare, 100)}%` }} />
          <span className="lck-dmg-text">{p.damageShare?.toFixed(1)}%</span>
        </div>
      </td>
      <td className="lck-stat-cs">{p.cs}</td>
    </tr>
  );
}

function GameStatsBlock({ game, idx }) {
  const [open, setOpen] = useState(idx === 0);
  const winCode = game.winnerCode;
  const blueName = game.blueTeam?.code || '블루';
  const redName  = game.redTeam?.code  || '레드';
  const isBlueWin = winCode === blueName;
  const isRedWin  = winCode === redName;

  return (
    <div className="lck-game-stats-block">
      <button className="lck-game-toggle" onClick={() => setOpen(!open)}>
        <span className="lck-game-num">게임 {game.gameNumber}</span>
        {game.duration && <span className="lck-game-dur">{game.duration}</span>}
        {winCode && (
          <span className="lck-game-winner-badge">{winCode} 승리</span>
        )}
        <span className="lck-game-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="lck-game-tables">
          {/* 블루팀 */}
          <div className={`lck-team-stat-section${isBlueWin ? ' lck-win-side' : ''}`}>
            <div className="lck-stat-team-header blue">
              <span>{game.blueTeam?.name || blueName}</span>
              {isBlueWin && <span className="lck-win-label">WIN</span>}
            </div>
            <div className="lck-stat-table-wrap">
              <table className="lck-stat-table">
                <thead>
                  <tr><th>포지션</th><th>선수</th><th>챔피언</th><th>KDA</th><th>KDA비율</th><th>데미지기여도</th><th>CS</th></tr>
                </thead>
                <tbody>
                  {(game.blueTeam?.players || []).map((p, i) => (
                    <PlayerStatRow key={i} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* 레드팀 */}
          <div className={`lck-team-stat-section${isRedWin ? ' lck-win-side' : ''}`}>
            <div className="lck-stat-team-header red">
              <span>{game.redTeam?.name || redName}</span>
              {isRedWin && <span className="lck-win-label">WIN</span>}
            </div>
            <div className="lck-stat-table-wrap">
              <table className="lck-stat-table">
                <thead>
                  <tr><th>포지션</th><th>선수</th><th>챔피언</th><th>KDA</th><th>KDA비율</th><th>데미지기여도</th><th>CS</th></tr>
                </thead>
                <tbody>
                  {(game.redTeam?.players || []).map((p, i) => (
                    <PlayerStatRow key={i} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 경기 상세 확장 패널 ──────────────────────────────────────────────────────

function MatchDetailExpand({ event }) {
  const t1 = event.teams?.[0];
  const t2 = event.teams?.[1];

  const [playerStats, setPlayerStats] = useState(null);
  const [loadingStats, setLSt]        = useState(false);
  const [analysis, setAnalysis]       = useState(null);
  const [generating, setGenerating]   = useState(false);

  useEffect(() => {
    if (!t1?.code || !t2?.code) return;
    setLSt(true);
    getCitoMatchPlayerStats(t1.code, t2.code)
      .then((res) => setPlayerStats(res.data || []))
      .catch(() => setPlayerStats([]))
      .finally(() => setLSt(false));
  }, [t1?.code, t2?.code]);

  const handleGenerate = async () => {
    setGenerating(true);
    setAnalysis(null);
    try {
      const res = await generateLckMatchAnalysis({
        team1Code:  t1?.code,
        team1Name:  t1?.name,
        team1Score: t1?.score,
        team2Code:  t2?.code,
        team2Name:  t2?.name,
        team2Score: t2?.score,
        blockName:  event.blockName,
        matchDate:  event.startTime,
        boCount:    event.strategy?.count,
      });
      setAnalysis(res.data);
    } catch {
      setAnalysis({ error: 'Gemini 분석 생성에 실패했습니다.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="lck-match-expand">
      {/* 선수 스탯 */}
      <div className="lck-expand-section">
        <h4 className="lck-expand-section-title">선수별 KDA · 데미지 기여도</h4>
        {loadingStats ? (
          <div className="lck-stats-loading">스탯 불러오는 중...</div>
        ) : playerStats && playerStats.length > 0 ? (
          playerStats.map((g, i) => <GameStatsBlock key={i} game={g} idx={i} />)
        ) : (
          <p className="lck-stats-empty">데이터베이스에 해당 경기의 선수 스탯이 없습니다.</p>
        )}
      </div>

      {/* Gemini 분석 */}
      <div className="lck-expand-section">
        <h4 className="lck-expand-section-title">AI 경기 요약</h4>
        <GeminiAnalysisPanel
          analysis={analysis}
          generating={generating}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  );
}

// ─── 경기 카드 ─────────────────────────────────────────────────────────────────

function MatchCard({ event }) {
  const [expanded, setExpanded] = useState(false);
  const t1 = event.teams?.[0];
  const t2 = event.teams?.[1];
  const done = event.state === 'completed';
  const t1Win = done && t1?.outcome === 'win';
  const t2Win = done && t2?.outcome === 'win';

  const handleClick = () => {
    if (!done) return;
    setExpanded((v) => !v);
  };

  return (
    <div className={`lck-match-card-wrap${expanded ? ' lck-match-card-expanded' : ''}`}>
      <div
        className={`esports-match-card${done ? ' lck-match-clickable' : ''}`}
        onClick={handleClick}
        title={done ? '클릭하여 선수 스탯 및 AI 분석 보기' : undefined}
      >
        <div className="esports-match-card-meta">
          <span className="esports-block-name">{event.blockName}</span>
          <span className="esports-match-date">{formatDate(event.startTime)}</span>
          <span className="esports-match-time">{formatTime(event.startTime)}</span>
          <StateBadge state={event.state} />
          {done && (
            <span className="lck-expand-hint">{expanded ? '▲ 접기' : '▼ 상세 보기'}</span>
          )}
        </div>
        <div className="esports-match-card-body">
          <div className={`esports-match-team${t1Win ? ' esports-team-win' : ''}`}>
            <TeamLogo imageUrl={t1?.imageUrl} name={t1?.name} size={32} />
            <span className="esports-team-name">{t1?.code || t1?.name || '-'}</span>
          </div>
          <div className="esports-match-score">
            {done ? (
              <span className="esports-score-text">
                <span className={t1Win ? 'esports-score-win' : ''}>{t1?.score ?? 0}</span>
                {' : '}
                <span className={t2Win ? 'esports-score-win' : ''}>{t2?.score ?? 0}</span>
              </span>
            ) : (
              <span className="esports-score-vs">VS</span>
            )}
            <span className="esports-bo">Bo{event.strategy?.count ?? 3}</span>
          </div>
          <div className={`esports-match-team esports-match-team-right${t2Win ? ' esports-team-win' : ''}`}>
            <span className="esports-team-name">{t2?.code || t2?.name || '-'}</span>
            <TeamLogo imageUrl={t2?.imageUrl} name={t2?.name} size={32} />
          </div>
        </div>
      </div>
      {expanded && done && <MatchDetailExpand event={event} />}
    </div>
  );
}

// ─── 순위표 ─────────────────────────────────────────────────────────────────────

function StandingsTable({ standings }) {
  if (!standings || standings.length === 0) return null;
  return (
    <div className="esports-standings">
      <h3 className="esports-standings-title">순위표</h3>
      <table className="esports-standings-table">
        <thead>
          <tr>
            <th>순위</th><th>팀</th><th>승</th><th>패</th><th>승률</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={i} className={row.rank === 1 ? 'esports-rank-top' : ''}>
              <td className="esports-rank-num">{row.rank}</td>
              <td className="esports-rank-team">
                {row.logoUrl && (
                  <img src={row.logoUrl} alt={row.teamName} width={22} height={22}
                    className="esports-team-logo"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                )}
                <span>{row.teamName}</span>
              </td>
              <td className="esports-rank-wins">{row.wins}</td>
              <td className="esports-rank-losses">{row.losses}</td>
              <td>{row.winRate != null ? `${(row.winRate * 100).toFixed(0)}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 팀 카드 (선수 명단 포함) ──────────────────────────────────────────────────

function PositionBadge({ pos }) {
  const upper = (pos || '').toUpperCase();
  const color = POS_COLOR[upper] || '#6b7280';
  return (
    <span className="lck-pos-badge" style={{ backgroundColor: color }}>
      {pos || '?'}
    </span>
  );
}

function TeamCard({ team, standingInfo, onPlayerClick }) {
  return (
    <div className="lck-team-card">
      <div className="lck-team-header">
        <TeamLogo imageUrl={team.logoUrl} name={team.shortName} size={36} />
        <div className="lck-team-title">
          <span className="lck-team-fullname">{team.teamName}</span>
          <span className="lck-team-code">{team.shortName}</span>
        </div>
        {standingInfo && (
          <div className="lck-team-record">
            <span className="lck-record-wins">{standingInfo.wins}승</span>
            <span className="lck-record-losses">{standingInfo.losses}패</span>
            {standingInfo.rank && (
              <span className="lck-record-rank">#{standingInfo.rank}</span>
            )}
          </div>
        )}
      </div>
      <ul className="lck-player-list">
        {(team.players || []).map((p) => (
          <li
            key={p.id}
            className="lck-player-item lck-player-clickable"
            onClick={() => onPlayerClick?.(p, team.teamName)}
            title="선수 지표 보기"
          >
            <PositionBadge pos={p.position} />
            <span className="lck-player-nick">{p.nickname}</span>
            <span className="lck-player-name">{p.playerName}</span>
            <span className="lck-player-arrow">›</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamsView({ teams, standings, loading, onPlayerClick }) {
  if (loading) return <LoadingState />;
  if (!teams || teams.length === 0)
    return <EmptyState title="팀 없음" description="팀 데이터를 불러오지 못했습니다." />;

  const standMap = {};
  if (standings) {
    standings.forEach((s) => {
      if (s.orgSlug) standMap[s.orgSlug.toUpperCase()] = s;
      const nameKey = (s.teamName || '').toUpperCase();
      if (nameKey) standMap[nameKey] = s;
    });
  }

  const findStanding = (team) => {
    const code = (team.shortName || '').toUpperCase();
    if (standMap[code]) return standMap[code];
    for (const key of Object.keys(standMap)) {
      if (key === code) return standMap[key];
      if (key.length >= 3 && code.length >= 3 &&
          (key.startsWith(code.slice(0, 3)) || code.startsWith(key.slice(0, 3))))
        return standMap[key];
    }
    return null;
  };

  return (
    <div className="lck-team-grid">
      {teams.map((t) => (
        <TeamCard
          key={t.teamId}
          team={t}
          standingInfo={findStanding(t)}
          onPlayerClick={onPlayerClick}
        />
      ))}
    </div>
  );
}

// ─── 오늘 경기 ─────────────────────────────────────────────────────────────────

function TodaySection({ events }) {
  if (!events || events.length === 0) return null;
  const upcoming = events.filter((e) => e.state !== 'completed');
  if (upcoming.length === 0) return null;
  return (
    <div className="esports-today-section">
      <h2 className="esports-today-title">오늘의 LCK 경기</h2>
      <div className="esports-today-list">
        {upcoming.map((e) => <MatchCard key={e.matchId} event={e} />)}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function EsportsPage() {
  const [seasons, setSeasons]         = useState([]);
  const [selectedSeason, setSelected] = useState(null);
  const [viewMode, setViewMode]       = useState('matches');
  const [matches, setMatches]         = useState([]);
  const [standings, setStandings]     = useState([]);
  const [teams, setTeams]             = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [loadingMatches, setLM]       = useState(false);
  const [loadingStand, setLS]         = useState(false);
  const [loadingTeams, setLT]         = useState(false);
  const [matchError, setME]           = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState(null);
  const abortRef = useRef(null);

  const handlePlayerClick = (player, teamName) => {
    setSelectedPlayer(player);
    setSelectedPlayerTeam(teamName);
  };
  const closePlayerModal = () => {
    setSelectedPlayer(null);
    setSelectedPlayerTeam(null);
  };

  useEffect(() => {
    const ctrl = new AbortController();
    setLT(true);
    Promise.all([
      getCitoSeasons(ctrl.signal),
      getCitoToday(ctrl.signal),
      getLckTeamsWithPlayers(ctrl.signal),
    ])
      .then(([sRes, tRes, teamRes]) => {
        const list = sRes.data || [];
        setSeasons(list);
        if (list.length > 0) setSelected(list[0]);
        const events = tRes?.data?.data?.events || [];
        setTodayEvents(events);
        setTeams(teamRes?.data || []);
      })
      .catch(() => {})
      .finally(() => setLT(false));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLM(true); setLS(true); setME(null); setMatches([]); setStandings([]);

    getCitoMatches(selectedSeason.from, selectedSeason.to, ctrl.signal)
      .then((res) => {
        const raw = res?.data?.data?.events || [];
        const seen = new Set();
        const events = raw.filter((e) => {
          if (!e.matchId || seen.has(e.matchId)) return false;
          seen.add(e.matchId);
          return true;
        });
        events.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        setMatches(events);
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setME('경기 데이터를 불러오지 못했습니다.');
      })
      .finally(() => setLM(false));

    getCitoStandings(selectedSeason.id, ctrl.signal)
      .then((res) => setStandings(res?.data || []))
      .catch(() => {})
      .finally(() => setLS(false));

    return () => ctrl.abort();
  }, [selectedSeason]);

  const handleSeasonClick = (s) => {
    if (selectedSeason?.id === s.id) return;
    setSelected(s);
  };

  return (
    <div className="esports-page">
      <div className="page-head">
        <h1 className="page-title">LCK E스포츠</h1>
        <p className="page-desc">실제 LCK 경기 결과와 팀·선수 정보를 확인하세요. 완료된 경기를 클릭하면 선수 스탯과 AI 요약을 볼 수 있습니다.</p>
      </div>

      <TodaySection events={todayEvents} />

      {/* 시즌 탭 */}
      <div className="esports-season-tabs">
        {seasons.map((s) => (
          <button
            key={s.id}
            className={`btn${selectedSeason?.id === s.id ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => handleSeasonClick(s)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* 뷰 모드 토글 */}
      {selectedSeason && (
        <div className="lck-view-toggle">
          <button
            className={`lck-view-btn${viewMode === 'matches' ? ' active' : ''}`}
            onClick={() => setViewMode('matches')}
          >
            경기 결과
          </button>
          <button
            className={`lck-view-btn${viewMode === 'teams' ? ' active' : ''}`}
            onClick={() => setViewMode('teams')}
          >
            팀 정보
          </button>
        </div>
      )}

      {selectedSeason && (
        <div className="esports-layout">
          {/* 왼쪽 패널 */}
          <div className="esports-match-list">
            {viewMode === 'matches' ? (
              <>
                <h2 className="esports-section-heading">
                  {selectedSeason.name} 경기 결과
                </h2>
                <p className="lck-click-hint">종료된 경기를 클릭하면 선수 KDA·데미지 기여도와 AI 요약을 볼 수 있습니다.</p>
                {matchError && <ErrorBox message={matchError} />}
                {loadingMatches ? (
                  <LoadingState />
                ) : matches.length === 0 ? (
                  <EmptyState title="경기 없음" description="해당 시즌 경기 데이터가 없습니다." />
                ) : (
                  <div className="esports-cards">
                    {matches.map((e) => <MatchCard key={e.matchId} event={e} />)}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="esports-section-heading">LCK 팀 정보</h2>
                <TeamsView
                  teams={teams}
                  standings={standings}
                  loading={loadingTeams}
                  onPlayerClick={handlePlayerClick}
                />
              </>
            )}
          </div>

          {/* 오른쪽 패널: 순위표 */}
          <div className="esports-standings-panel">
            {loadingStand ? (
              <LoadingState />
            ) : standings.length > 0 ? (
              <StandingsTable standings={standings} />
            ) : (
              <div className="esports-standings">
                <h3 className="esports-standings-title">순위표</h3>
                <p className="lck-standings-empty">
                  {selectedSeason.name} 순위 데이터를 불러오는 중입니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 선수 지표 모달 */}
      {selectedPlayer && (
        <PlayerStatsModal
          player={selectedPlayer}
          teamName={selectedPlayerTeam}
          onClose={closePlayerModal}
        />
      )}
    </div>
  );
}
