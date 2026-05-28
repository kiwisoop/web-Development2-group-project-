import { useState, useEffect, useRef } from 'react';
import {
  getCitoSeasons, getCitoMatches, getCitoStandings, getCitoToday,
  getLckTeamsWithPlayers, getCitoMatchGames, generateLckMatchAnalysis,
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

function GroqAnalysisPanel({ analysis, generating, onGenerate }) {
  if (generating) {
    return (
      <div className="lck-gemini-panel lck-gemini-loading">
        <span className="lck-gemini-spinner" />
        Groq AI가 경기를 분석 중입니다... (최대 50초 소요)
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
          <span className="lck-gemini-badge">Groq AI 분석</span>
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
      <p className="lck-gemini-desc">선수 KDA·데미지 기여도를 참고해 Groq AI가 경기 요약을 작성합니다.</p>
      <button className="btn btn-primary" onClick={onGenerate}>AI 경기 요약 생성</button>
    </div>
  );
}

// ─── 게임별 팀 통계 ────────────────────────────────────────────────────────────

function formatGameTime(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}분 ${s}초`;
}

function teamDisplay(slug, eventTeams) {
  const t = eventTeams?.find((x) => (x.slug || '').toLowerCase() === (slug || '').toLowerCase());
  return {
    name: t?.name || slug?.toUpperCase() || '?',
    code: t?.code || slug?.toUpperCase() || '?',
    imageUrl: t?.imageUrl,
  };
}

function TeamStatRow({ label, blueVal, redVal, isBlueBetter, isRedBetter }) {
  return (
    <tr>
      <td className={`lck-team-stat-val blue${isBlueBetter ? ' lck-stat-better' : ''}`}>{blueVal}</td>
      <td className="lck-team-stat-label">{label}</td>
      <td className={`lck-team-stat-val red${isRedBetter ? ' lck-stat-better' : ''}`}>{redVal}</td>
    </tr>
  );
}

function firstObjBadges(firstObjs, blueSlug, redSlug) {
  if (!firstObjs) return null;
  const items = [
    ['퍼블', firstObjs.firstBlood],
    ['퍼타', firstObjs.firstTower],
    ['퍼드', firstObjs.firstDragon],
    ['퍼바', firstObjs.firstBaron],
    ['퍼전령', firstObjs.firstHerald],
  ].filter(([, side]) => side === 'blue' || side === 'red');
  if (items.length === 0) return null;
  return (
    <div className="lck-firstobj-row">
      {items.map(([label, side]) => (
        <span key={label} className={`lck-firstobj-chip ${side}`}>
          <span className="lck-firstobj-label">{label}</span>
          <span className="lck-firstobj-team">{side === 'blue' ? blueSlug : redSlug}</span>
        </span>
      ))}
    </div>
  );
}

function GameStatsBlock({ game, idx, eventTeams }) {
  const [open, setOpen] = useState(idx === 0);
  const blue = teamDisplay(game.blueTeam?.slug, eventTeams);
  const red  = teamDisplay(game.redTeam?.slug,  eventTeams);
  const winSide = game.winningSide;

  const b = game.blueTeam || {}, r = game.redTeam || {};

  return (
    <div className="lck-game-stats-block">
      <button className="lck-game-toggle" onClick={() => setOpen(!open)}>
        <span className="lck-game-num">게임 {game.gameNumber}</span>
        {game.duration > 0 && <span className="lck-game-dur">{formatGameTime(game.duration)}</span>}
        {game.patch && <span className="lck-game-dur">패치 {game.patch}</span>}
        {winSide && (
          <span className="lck-game-winner-badge">
            {(winSide === 'blue' ? blue.code : red.code)} 승리
          </span>
        )}
        <span className="lck-game-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="lck-game-tables">
          {/* 팀 헤더 */}
          <div className="lck-tg-headers">
            <div className={`lck-tg-team blue${winSide === 'blue' ? ' lck-win-side' : ''}`}>
              <TeamLogo imageUrl={blue.imageUrl} name={blue.code} size={28} />
              <span className="lck-tg-name">{blue.name}</span>
              <span className="lck-tg-side">BLUE</span>
              {winSide === 'blue' && <span className="lck-win-label">WIN</span>}
            </div>
            <div className={`lck-tg-team red${winSide === 'red' ? ' lck-win-side' : ''}`}>
              {winSide === 'red' && <span className="lck-win-label">WIN</span>}
              <span className="lck-tg-side">RED</span>
              <span className="lck-tg-name">{red.name}</span>
              <TeamLogo imageUrl={red.imageUrl} name={red.code} size={28} />
            </div>
          </div>

          {/* 팀 통계 비교표 */}
          <div className="lck-stat-table-wrap">
            <table className="lck-stat-table lck-team-stat-table">
              <tbody>
                <TeamStatRow label="킬"      blueVal={b.kills  ?? 0} redVal={r.kills  ?? 0}
                  isBlueBetter={(b.kills ?? 0) > (r.kills ?? 0)} isRedBetter={(r.kills ?? 0) > (b.kills ?? 0)} />
                <TeamStatRow label="골드"    blueVal={(b.gold ?? 0).toLocaleString()} redVal={(r.gold ?? 0).toLocaleString()}
                  isBlueBetter={(b.gold ?? 0) > (r.gold ?? 0)} isRedBetter={(r.gold ?? 0) > (b.gold ?? 0)} />
                <TeamStatRow label="타워"    blueVal={b.towers ?? 0} redVal={r.towers ?? 0}
                  isBlueBetter={(b.towers ?? 0) > (r.towers ?? 0)} isRedBetter={(r.towers ?? 0) > (b.towers ?? 0)} />
                <TeamStatRow label="드래곤"  blueVal={b.dragons ?? 0} redVal={r.dragons ?? 0}
                  isBlueBetter={(b.dragons ?? 0) > (r.dragons ?? 0)} isRedBetter={(r.dragons ?? 0) > (b.dragons ?? 0)} />
                <TeamStatRow label="바론"    blueVal={b.barons ?? 0} redVal={r.barons ?? 0}
                  isBlueBetter={(b.barons ?? 0) > (r.barons ?? 0)} isRedBetter={(r.barons ?? 0) > (b.barons ?? 0)} />
                <TeamStatRow label="전령"    blueVal={b.heralds ?? 0} redVal={r.heralds ?? 0}
                  isBlueBetter={(b.heralds ?? 0) > (r.heralds ?? 0)} isRedBetter={(r.heralds ?? 0) > (b.heralds ?? 0)} />
              </tbody>
            </table>
          </div>

          {/* 퍼스트 오브젝트 */}
          {firstObjBadges(game.firstObjectives, blue.code, red.code)}

          {/* 밴 챔피언 */}
          {(b.bans?.length > 0 || r.bans?.length > 0) && (
            <div className="lck-bans-section">
              <div className="lck-bans-team blue">
                <span className="lck-bans-label">{blue.code} 밴</span>
                <div className="lck-bans-list">
                  {(b.bans || []).map((c, i) => (
                    <span key={i} className="lck-ban-chip">{c}</span>
                  ))}
                </div>
              </div>
              <div className="lck-bans-team red">
                <span className="lck-bans-label">{red.code} 밴</span>
                <div className="lck-bans-list">
                  {(r.bans || []).map((c, i) => (
                    <span key={i} className="lck-ban-chip">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 경기 상세 확장 패널 ──────────────────────────────────────────────────────

function MatchDetailExpand({ event }) {
  const t1 = event.teams?.[0];
  const t2 = event.teams?.[1];

  const [gameStats, setGameStats]     = useState(null);
  const [loadingStats, setLSt]        = useState(false);
  const [analysis, setAnalysis]       = useState(null);
  const [generating, setGenerating]   = useState(false);

  useEffect(() => {
    if (!event.matchId) return;
    setLSt(true);
    getCitoMatchGames(event.matchId)
      .then((res) => setGameStats(res.data || []))
      .catch(() => setGameStats([]))
      .finally(() => setLSt(false));
  }, [event.matchId]);

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
      setAnalysis({ error: 'Groq AI 분석 생성에 실패했습니다.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="lck-match-expand">
      {/* 게임별 팀 통계 */}
      <div className="lck-expand-section">
        <h4 className="lck-expand-section-title">게임별 팀 통계</h4>
        {loadingStats ? (
          <div className="lck-stats-loading">통계 불러오는 중...</div>
        ) : gameStats && gameStats.length > 0 ? (
          gameStats.map((g, i) => (
            <GameStatsBlock key={g.gameId || i} game={g} idx={i} eventTeams={event.teams} />
          ))
        ) : (
          <p className="lck-stats-empty">이 경기의 게임 통계를 불러오지 못했습니다.</p>
        )}
      </div>

      {/* Groq AI 분석 */}
      <div className="lck-expand-section">
        <h4 className="lck-expand-section-title">AI 경기 요약</h4>
        <GroqAnalysisPanel
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
    Promise.allSettled([
      getCitoSeasons(ctrl.signal),
      getCitoToday(ctrl.signal),
      getLckTeamsWithPlayers(ctrl.signal),
    ])
      .then(([sRes, tRes, teamRes]) => {
        if (sRes.status === 'fulfilled') {
          const list = sRes.value?.data || [];
          setSeasons(list);
          if (list.length > 0) setSelected(list[0]);
        }
        if (tRes.status === 'fulfilled') {
          setTodayEvents(tRes.value?.data?.data?.events || []);
        }
        if (teamRes.status === 'fulfilled') {
          setTeams(teamRes.value?.data || []);
        }
      })
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
