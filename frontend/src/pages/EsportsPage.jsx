import { useEffect, useRef, useState } from 'react';
import {
  generateLckMatchAnalysis,
  getCitoMatches,
  getCitoMatchGames,
  getCitoMatchPlayerStats,
  getCitoSeasons,
  getCitoStandings,
  getLckTeamsWithPlayers,
} from '../api/lckApi';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';
import LoadingState from '../components/LoadingState';
import PlayerStatsModal from '../components/PlayerStatsModal';
import TeamLogo from '../components/TeamLogo';

const POS_COLOR = {
  TOP: '#ef4444',
  JGL: '#22c55e',
  JNG: '#22c55e',
  JUNGLE: '#22c55e',
  MID: '#3b82f6',
  BOT: '#f59e0b',
  ADC: '#f59e0b',
  SUP: '#a855f7',
  SUPPORT: '#a855f7',
};

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' });
}

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function eventDateKey(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return localDateKey(date);
}

function hasKnownTeams(event) {
  const teams = event?.teams || [];
  if (teams.length < 2) return false;
  return teams.every((team) => {
    const name = String(team?.name || team?.teamName || team?.code || team?.shortName || '').trim().toUpperCase();
    return name && name !== 'TBD';
  });
}

function toLogoTeam(team) {
  return {
    teamName: team?.name || team?.teamName || team?.code || team?.shortName || '-',
    shortName: team?.code || team?.shortName || team?.name || '-',
    logoUrl: team?.imageUrl || team?.logoUrl,
  };
}

function extractEvents(response) {
  const events = response?.data?.data?.events || response?.data?.events || [];
  if (!Array.isArray(events)) return [];

  const seen = new Set();
  return events
    .filter((event) => {
      const key = event.matchId || `${event.startTime}-${event.teams?.[0]?.code}-${event.teams?.[1]?.code}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
}

function StateBadge({ state }) {
  if (state === 'completed') return <span className="esports-state-badge done">종료</span>;
  if (state === 'inProgress') return <span className="esports-state-badge live">LIVE</span>;
  return <span className="esports-state-badge upcoming">예정</span>;
}

function PositionBadge({ pos }) {
  const upper = (pos || '').toUpperCase();
  const color = POS_COLOR[upper] || '#6b7280';
  return (
    <span className="lck-pos-badge" style={{ backgroundColor: color }}>
      {pos || '?'}
    </span>
  );
}

function GroqAnalysisPanel({ analysis, generating, onGenerate }) {
  if (generating) {
    return (
      <div className="lck-groq-panel lck-groq-loading">
        <span className="lck-groq-spinner" />
        Groq AI가 경기를 분석 중입니다...
      </div>
    );
  }

  if (analysis?.error) {
    return (
      <div className="lck-groq-panel lck-groq-error">
        <span className="lck-groq-error-msg">{analysis.error}</span>
        <button className="btn btn-outline btn-sm" onClick={onGenerate}>다시 시도</button>
      </div>
    );
  }

  if (analysis) {
    return (
      <div className="lck-groq-panel lck-groq-done">
        <div className="lck-groq-header">
          <span className="lck-groq-badge">Groq AI 분석</span>
          <button className="btn btn-outline btn-sm" onClick={onGenerate}>재생성</button>
        </div>
        {analysis.summary && (
          <div className="lck-groq-block">
            <strong>요약</strong>
            <p>{analysis.summary}</p>
          </div>
        )}
        {analysis.tactical && (
          <div className="lck-groq-block">
            <strong>전술 분석</strong>
            <p>{analysis.tactical}</p>
          </div>
        )}
        {analysis.keyPoint && (
          <div className="lck-groq-block">
            <strong>핵심 포인트</strong>
            <p>{analysis.keyPoint}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lck-groq-panel lck-groq-empty">
      <p className="lck-groq-desc">선수 KDA와 데미지 기여도를 참고해 Groq AI가 경기 요약을 작성합니다.</p>
      <button className="btn btn-primary" onClick={onGenerate}>Groq AI 분석</button>
    </div>
  );
}

function PlayerStatRow({ player }) {
  const deaths = Number(player.deaths ?? 0);
  const kills = Number(player.kills ?? 0);
  const assists = Number(player.assists ?? 0);
  const kda = deaths === 0 ? `${(kills + assists).toFixed(1)}:1` : ((kills + assists) / deaths).toFixed(2);

  return (
    <tr>
      <td><PositionBadge pos={player.position} /></td>
      <td className="lck-stat-nick">{player.nickname || '-'}</td>
      <td className="lck-stat-champ">{player.champion || '-'}</td>
      <td className="lck-stat-kda">
        <span className="lck-kda-kills">{kills}</span>/
        <span className="lck-kda-deaths">{deaths}</span>/
        <span className="lck-kda-assists">{assists}</span>
      </td>
      <td>{kda}</td>
      <td>
        <div className="lck-dmg-bar-wrap">
          <div className="lck-dmg-bar" style={{ width: `${Math.min(Number(player.damageShare || 0), 100)}%` }} />
          <span className="lck-dmg-text">{Number(player.damageShare || 0).toFixed(1)}%</span>
        </div>
      </td>
      <td className="lck-stat-cs">{player.cs ?? '-'}</td>
    </tr>
  );
}

function GameStatsBlock({ game, index }) {
  const [open, setOpen] = useState(index === 0);
  const blueCode = game.blueTeam?.code || 'BLUE';
  const redCode = game.redTeam?.code || 'RED';
  const winner = game.winnerCode;
  const blueWin = winner === blueCode;
  const redWin = winner === redCode;

  return (
    <div className="lck-game-stats-block">
      <button className="lck-game-toggle" onClick={() => setOpen((value) => !value)}>
        <span className="lck-game-num">게임 {game.gameNumber}</span>
        {game.duration && <span className="lck-game-dur">{game.duration}</span>}
        {winner && <span className="lck-game-winner-badge">{winner} 승리</span>}
        <span className="lck-game-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="lck-game-tables">
          <div className={`lck-team-stat-section${blueWin ? ' lck-win-side' : ''}`}>
            <div className="lck-stat-team-header blue">
              <span>{game.blueTeam?.name || blueCode}</span>
              {blueWin && <span className="lck-win-label">WIN</span>}
            </div>
            <div className="lck-stat-table-wrap">
              <table className="lck-stat-table">
                <thead>
                  <tr><th>포지션</th><th>선수</th><th>챔피언</th><th>KDA</th><th>KDA비율</th><th>데미지기여도</th><th>CS</th></tr>
                </thead>
                <tbody>
                  {(game.blueTeam?.players || []).map((player, idx) => <PlayerStatRow key={`${player.nickname}-${idx}`} player={player} />)}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`lck-team-stat-section${redWin ? ' lck-win-side' : ''}`}>
            <div className="lck-stat-team-header red">
              <span>{game.redTeam?.name || redCode}</span>
              {redWin && <span className="lck-win-label">WIN</span>}
            </div>
            <div className="lck-stat-table-wrap">
              <table className="lck-stat-table">
                <thead>
                  <tr><th>포지션</th><th>선수</th><th>챔피언</th><th>KDA</th><th>KDA비율</th><th>데미지기여도</th><th>CS</th></tr>
                </thead>
                <tbody>
                  {(game.redTeam?.players || []).map((player, idx) => <PlayerStatRow key={`${player.nickname}-${idx}`} player={player} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  if (!value) return '-';
  const minutes = Math.floor(value / 60);
  const remain = value % 60;
  return `${minutes}분 ${String(remain).padStart(2, '0')}초`;
}

function numberText(value) {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return Number(value).toLocaleString('ko-KR');
}

function firstObjectiveLabel(key) {
  return {
    firstBlood: '퍼블',
    firstTower: '퍼타',
    firstDragon: '퍼드',
    firstBaron: '퍼바',
    firstHerald: '퍼전령',
  }[key] || key;
}

function CitoTeamStatBlock({ game, index }) {
  const [open, setOpen] = useState(index === 0);
  const blue = game.blueTeam || {};
  const red = game.redTeam || {};
  const blueWin = game.winningSide === 'blue';
  const redWin = game.winningSide === 'red';
  const firstObjectives = Object.entries(game.firstObjectives || {}).filter(([, side]) => side);

  const metrics = [
    ['킬', 'kills'],
    ['골드', 'gold'],
    ['타워', 'towers'],
    ['드래곤', 'dragons'],
    ['바론', 'barons'],
    ['전령', 'heralds'],
  ];

  return (
    <div className="lck-game-stats-block">
      <button className="lck-game-toggle" onClick={() => setOpen((value) => !value)}>
        <span className="lck-game-num">게임 {game.gameNumber}</span>
        <span className="lck-game-dur">{formatDuration(game.duration)}</span>
        {game.patch && <span className="lck-game-dur">패치 {game.patch}</span>}
        {(blueWin || redWin) && (
          <span className="lck-game-winner-badge">{blueWin ? blue.shortName : red.shortName} 승리</span>
        )}
        <span className="lck-game-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="lck-cito-game-body">
          <div className="lck-tg-row">
            <div className={`lck-tg-team blue${blueWin ? ' lck-win-side' : ''}`}>
              <TeamLogo team={{ teamName: blue.name, shortName: blue.shortName, logoUrl: blue.logoUrl }} size={42} radius={10} />
              <strong>{blue.name || blue.shortName || 'BLUE'}</strong>
              <span className="lck-tg-side">BLUE</span>
              {blueWin && <span className="lck-win-label">WIN</span>}
            </div>
            <div className={`lck-tg-team red${redWin ? ' lck-win-side' : ''}`}>
              <TeamLogo team={{ teamName: red.name, shortName: red.shortName, logoUrl: red.logoUrl }} size={42} radius={10} />
              <strong>{red.name || red.shortName || 'RED'}</strong>
              <span className="lck-tg-side">RED</span>
              {redWin && <span className="lck-win-label">WIN</span>}
            </div>
          </div>

          <div className="lck-team-stat-table">
            {metrics.map(([label, key]) => {
              const blueValue = Number(blue[key] || 0);
              const redValue = Number(red[key] || 0);
              const blueBetter = blueValue > redValue;
              const redBetter = redValue > blueValue;
              return (
                <div className="lck-team-stat-row" key={key}>
                  <span className={`lck-team-stat-val blue${blueBetter ? ' lck-stat-better' : ''}`}>{numberText(blue[key])}</span>
                  <span className="lck-team-stat-label">{label}</span>
                  <span className={`lck-team-stat-val red${redBetter ? ' lck-stat-better' : ''}`}>{numberText(red[key])}</span>
                </div>
              );
            })}
          </div>

          {firstObjectives.length > 0 && (
            <div className="lck-firstobj-row">
              {firstObjectives.map(([key, side]) => (
                <span key={key} className={`lck-firstobj-chip ${side}`}>
                  <span className="lck-firstobj-label">{firstObjectiveLabel(key)}</span>
                  <span className="lck-firstobj-team">{side === 'blue' ? blue.shortName : red.shortName}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchDetailExpand({ event }) {
  const team1 = event.teams?.[0];
  const team2 = event.teams?.[1];
  const [playerStats, setPlayerStats] = useState(null);
  const [citoGames, setCitoGames] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!team1?.code || !team2?.code) return undefined;
    const controller = new AbortController();
    setLoadingStats(true);
    Promise.allSettled([
      getCitoMatchPlayerStats(team1.code, team2.code, controller.signal),
      event.matchId ? getCitoMatchGames(event.matchId, controller.signal) : Promise.resolve({ data: [] }),
    ])
      .then(([playerRes, citoRes]) => {
        setPlayerStats(playerRes.status === 'fulfilled' ? playerRes.value.data || [] : []);
        setCitoGames(citoRes.status === 'fulfilled' ? citoRes.value.data || [] : []);
      })
      .catch(() => {
        setPlayerStats([]);
        setCitoGames([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingStats(false);
      });
    return () => controller.abort();
  }, [event.matchId, team1?.code, team2?.code]);

  const handleGenerate = async () => {
    setGenerating(true);
    setAnalysis(null);
    try {
      const res = await generateLckMatchAnalysis({
        team1Code: team1?.code,
        team1Name: team1?.name,
        team1Score: team1?.score,
        team2Code: team2?.code,
        team2Name: team2?.name,
        team2Score: team2?.score,
        blockName: event.blockName,
        matchDate: event.startTime,
        boCount: event.strategy?.count,
      });
      setAnalysis(res.data);
    } catch {
      setAnalysis({ error: 'Groq 분석 생성에 실패했습니다.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="lck-match-expand">
      <div className="lck-expand-section">
        <h4 className="lck-expand-section-title">선수별 KDA · 데미지 기여도</h4>
        {loadingStats ? (
          <div className="lck-stats-loading">스탯 불러오는 중...</div>
        ) : playerStats && playerStats.length > 0 ? (
          playerStats.map((game, index) => <GameStatsBlock key={`${game.gameNumber}-${index}`} game={game} index={index} />)
        ) : citoGames && citoGames.length > 0 ? (
          <>
            <p className="lck-stats-empty">선수별 KDA 데이터가 없어 Cito 게임별 팀 통계로 표시합니다.</p>
            {citoGames.map((game, index) => <CitoTeamStatBlock key={game.gameId || index} game={game} index={index} />)}
          </>
        ) : (
          <p className="lck-stats-empty">해당 경기의 스탯 데이터를 불러오지 못했습니다.</p>
        )}
      </div>

      <div className="lck-expand-section">
        <h4 className="lck-expand-section-title">AI 경기 요약</h4>
        <GroqAnalysisPanel analysis={analysis} generating={generating} onGenerate={handleGenerate} />
      </div>
    </div>
  );
}

function MatchCard({ event }) {
  const [expanded, setExpanded] = useState(false);
  const team1 = event.teams?.[0];
  const team2 = event.teams?.[1];
  const done = event.state === 'completed';
  const team1Win = done && team1?.outcome === 'win';
  const team2Win = done && team2?.outcome === 'win';

  const handleClick = () => {
    if (!done) return;
    setExpanded((value) => !value);
  };

  return (
    <div className={`lck-match-card-wrap${expanded ? ' lck-match-card-expanded' : ''}`}>
      <article
        className={`esports-match-card${done ? ' lck-match-clickable' : ''}`}
        onClick={handleClick}
        title={done ? '클릭하여 선수 스탯 및 AI 분석 보기' : undefined}
      >
        <div className="esports-match-card-meta">
          <span className="esports-block-name">{event.blockName || 'LCK'}</span>
          <span className="esports-match-date">{formatDate(event.startTime)}</span>
          <span className="esports-match-time">{formatTime(event.startTime)}</span>
          <StateBadge state={event.state} />
          {done && <span className="lck-expand-hint">{expanded ? '▲ 접기' : '▼ 상세 보기'}</span>}
        </div>

        <div className="esports-match-card-body">
          <div className={`esports-match-team${team1Win ? ' esports-team-win' : ''}`}>
            <TeamLogo team={toLogoTeam(team1)} size={34} radius={10} />
            <span className="esports-team-name">{team1?.code || team1?.name || '-'}</span>
          </div>

          <div className="esports-match-score">
            {done ? (
              <span className="esports-score-text">
                <span className={team1Win ? 'esports-score-win' : ''}>{team1?.score ?? 0}</span>
                {' : '}
                <span className={team2Win ? 'esports-score-win' : ''}>{team2?.score ?? 0}</span>
              </span>
            ) : (
              <span className="esports-score-vs">VS</span>
            )}
            <span className="esports-bo">Bo{event.strategy?.count ?? 3}</span>
          </div>

          <div className={`esports-match-team esports-match-team-right${team2Win ? ' esports-team-win' : ''}`}>
            <span className="esports-team-name">{team2?.code || team2?.name || '-'}</span>
            <TeamLogo team={toLogoTeam(team2)} size={34} radius={10} />
          </div>
        </div>
      </article>
      {expanded && done && <MatchDetailExpand event={event} />}
    </div>
  );
}

function StandingsTable({ standings }) {
  if (!standings || standings.length === 0) {
    return <p className="lck-standings-empty">순위 데이터를 불러오는 중입니다.</p>;
  }

  return (
    <table className="esports-standings-table">
      <thead>
        <tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>승률</th></tr>
      </thead>
      <tbody>
        {standings.map((row, index) => (
          <tr key={`${row.teamName}-${index}`} className={row.rank === 1 ? 'esports-rank-top' : ''}>
            <td className="esports-rank-num">{row.rank}</td>
            <td className="esports-rank-team">
              <TeamLogo team={{ teamName: row.teamName, shortName: row.orgSlug || row.teamName, logoUrl: row.logoUrl }} size={24} radius={6} />
              <span>{row.teamName}</span>
            </td>
            <td className="esports-rank-wins">{row.wins}</td>
            <td className="esports-rank-losses">{row.losses}</td>
            <td>{row.winRate != null ? `${(row.winRate * 100).toFixed(0)}%` : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TeamCard({ team, standingInfo, onPlayerClick }) {
  return (
    <article className="lck-team-card">
      <div className="lck-team-header">
        <TeamLogo team={team} size={38} radius={10} />
        <div className="lck-team-title">
          <span className="lck-team-fullname">{team.teamName}</span>
          <span className="lck-team-code">{team.shortName}</span>
        </div>
        {standingInfo && (
          <div className="lck-team-record">
            <span className="lck-record-wins">{standingInfo.wins}승</span>
            <span className="lck-record-losses">{standingInfo.losses}패</span>
            {standingInfo.rank && <span className="lck-record-rank">#{standingInfo.rank}</span>}
          </div>
        )}
      </div>

      <ul className="lck-player-list">
        {(team.players || []).map((player) => (
          <li
            key={player.id}
            className="lck-player-item lck-player-clickable"
            onClick={() => onPlayerClick?.(player, team.teamName)}
            title="선수 지표 보기"
          >
            <PositionBadge pos={player.position} />
            <span className="lck-player-nick">{player.nickname}</span>
            <span className="lck-player-name">{player.playerName}</span>
            <span className="lck-player-arrow">›</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function TeamsView({ teams, standings, loading, onPlayerClick }) {
  if (loading) return <LoadingState />;
  if (!teams || teams.length === 0) return <EmptyState title="팀 없음" description="팀 데이터를 불러오지 못했습니다." />;

  const standMap = {};
  standings.forEach((row) => {
    if (row.orgSlug) standMap[row.orgSlug.toUpperCase()] = row;
    if (row.teamName) standMap[row.teamName.toUpperCase()] = row;
  });

  const findStanding = (team) => {
    const code = String(team.shortName || '').toUpperCase();
    const name = String(team.teamName || '').toUpperCase();
    if (standMap[code]) return standMap[code];
    if (standMap[name]) return standMap[name];
    return Object.entries(standMap).find(([key]) => key.includes(code) || code.includes(key))?.[1] || null;
  };

  return (
    <div className="lck-team-grid">
      {teams.map((team) => (
        <TeamCard
          key={team.teamId || team.id || team.shortName}
          team={team}
          standingInfo={findStanding(team)}
          onPlayerClick={onPlayerClick}
        />
      ))}
    </div>
  );
}

function TodaySection({ events }) {
  const today = localDateKey();
  const upcoming = (events || [])
    .filter((event) => event.state !== 'completed')
    .filter((event) => eventDateKey(event.startTime) === today)
    .filter(hasKnownTeams)
    .sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0))
    .slice(0, 4);

  return (
    <section className="esports-today-section">
      <h2 className="esports-today-title">오늘의 LCK 경기</h2>
      {upcoming.length === 0 ? (
        <p className="lck-standings-empty">오늘 예정된 LCK 경기가 없습니다.</p>
      ) : (
        <div className="esports-today-list">
          {upcoming.map((event) => <MatchCard key={event.matchId || event.startTime} event={event} />)}
        </div>
      )}
    </section>
  );
}

export default function EsportsPage() {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [viewMode, setViewMode] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [matchError, setMatchError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingTeams(true);
    const today = localDateKey();

    Promise.allSettled([
      getCitoSeasons(controller.signal),
      getCitoMatches(today, today, controller.signal),
      getLckTeamsWithPlayers(controller.signal),
    ])
      .then(([seasonRes, todayRes, teamRes]) => {
        if (seasonRes.status === 'fulfilled') {
          const list = Array.isArray(seasonRes.value.data) ? seasonRes.value.data : [];
          setSeasons(list);
          setSelectedSeason(list[0] || null);
        }
        if (todayRes.status === 'fulfilled') setTodayEvents(extractEvents(todayRes.value));
        if (teamRes.status === 'fulfilled') setTeams(Array.isArray(teamRes.value.data) ? teamRes.value.data : []);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTeams(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedSeason) return undefined;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingMatches(true);
    setLoadingStandings(true);
    setMatchError(null);
    setMatches([]);
    setStandings([]);

    getCitoMatches(selectedSeason.from, selectedSeason.to, controller.signal)
      .then((res) => setMatches(extractEvents(res)))
      .catch((err) => {
        if (err?.code !== 'ERR_CANCELED') setMatchError('경기 데이터를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingMatches(false);
      });

    getCitoStandings(selectedSeason.id, controller.signal)
      .then((res) => setStandings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setStandings([]))
      .finally(() => {
        if (!controller.signal.aborted) setLoadingStandings(false);
      });

    return () => controller.abort();
  }, [selectedSeason]);

  const handlePlayerClick = (player, teamName) => {
    setSelectedPlayer(player);
    setSelectedPlayerTeam(teamName);
  };

  return (
    <div className="esports-page">
      <div className="page-head">
        <h1 className="page-title">LCK e스포츠</h1>
        <p className="page-desc">
          실제 LCK 경기 결과와 팀·선수 정보를 확인하세요. 종료된 경기를 클릭하면 선수 스탯과 AI 요약을 볼 수 있습니다.
        </p>
      </div>

      <TodaySection events={todayEvents} />

      <div className="esports-season-tabs">
        {seasons.map((season) => (
          <button
            type="button"
            key={season.id}
            className={`btn${selectedSeason?.id === season.id ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => setSelectedSeason(season)}
          >
            {season.name}
          </button>
        ))}
      </div>

      {selectedSeason && (
        <div className="lck-view-toggle">
          <button
            type="button"
            className={`lck-view-btn${viewMode === 'matches' ? ' active' : ''}`}
            onClick={() => setViewMode('matches')}
          >
            경기 결과
          </button>
          <button
            type="button"
            className={`lck-view-btn${viewMode === 'teams' ? ' active' : ''}`}
            onClick={() => setViewMode('teams')}
          >
            팀 정보
          </button>
        </div>
      )}

      {selectedSeason && (
        <div className="esports-layout">
          <div className="esports-match-list">
            {viewMode === 'matches' ? (
              <>
                <h2 className="esports-section-heading">{selectedSeason.name} 경기 결과</h2>
                <p className="lck-click-hint">종료된 경기를 클릭하면 선수 KDA·데미지 기여도와 AI 요약을 볼 수 있습니다.</p>
                {matchError && <ErrorBox message={matchError} />}
                {loadingMatches ? (
                  <LoadingState />
                ) : matches.length === 0 ? (
                  <EmptyState title="경기 없음" description="해당 시즌 경기 데이터가 없습니다." />
                ) : (
                  <div className="esports-cards">
                    {matches.map((event) => <MatchCard key={event.matchId || event.startTime} event={event} />)}
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

          <aside className="esports-standings-panel">
            <div className="esports-standings">
              <h3 className="esports-standings-title">순위표</h3>
              {loadingStandings ? <LoadingState /> : <StandingsTable standings={standings} />}
            </div>
          </aside>
        </div>
      )}

      {selectedPlayer && (
        <PlayerStatsModal
          player={selectedPlayer}
          teamName={selectedPlayerTeam}
          onClose={() => {
            setSelectedPlayer(null);
            setSelectedPlayerTeam(null);
          }}
        />
      )}
    </div>
  );
}
