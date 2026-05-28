import axiosInstance from './axiosInstance';

// ── DB 기반 ──────────────────────────────────────────────────────────────────
export const getLckMatches  = (signal) => axiosInstance.get('/lck/matches', { signal });
export const getLckGames    = (matchId, signal) => axiosInstance.get(`/lck/matches/${matchId}/games`, { signal });
export const getLckGameDetail = (gameId, signal) => axiosInstance.get(`/lck/games/${gameId}`, { signal });
export const getLckTeams    = (signal) => axiosInstance.get('/lck/teams', { signal });
export const getLckPlayers  = (teamId, signal) => axiosInstance.get(`/lck/teams/${teamId}/players`, { signal });

// ── Cito API 프록시 ───────────────────────────────────────────────────────────
export const getCitoSeasons   = (signal) => axiosInstance.get('/lck/cito/seasons', { signal });
export const getCitoMatches   = (from, to, signal) => axiosInstance.get(`/lck/cito/matches?from=${from}&to=${to}`, { signal });
export const getCitoStandings = (tournamentId, signal) => axiosInstance.get(`/lck/cito/standings/${tournamentId}`, { signal });
export const getCitoToday     = (signal) => axiosInstance.get('/lck/cito/today', { signal });

// ── DB 기반 팀 + 선수 ────────────────────────────────────────────────────────
export const getLckTeamsWithPlayers = (signal) => axiosInstance.get('/lck/teams/with-players', { signal });

// ── 선수 지표 ────────────────────────────────────────────────────────────────
export const getPlayerSeasonSummary = (playerId, signal) =>
  axiosInstance.get(`/lck/players/${playerId}/season-summary`, { signal });
export const getPlayerGameStats = (playerId, season, signal) =>
  axiosInstance.get(`/lck/players/${playerId}/game-stats`, { params: season ? { season } : {}, signal });
export const getPlayerCareer = (playerId, signal) =>
  axiosInstance.get(`/lck/players/${playerId}/career`, { signal });

// ── Cito 경기 선수 스탯 + Gemini 분석 ──────────────────────────────────────
export const getCitoMatchPlayerStats = (team1Code, team2Code, signal) =>
  axiosInstance.get('/lck/cito/match-player-stats', { params: { team1Code, team2Code }, signal });

export const generateLckMatchAnalysis = (data) =>
  axiosInstance.post('/lck/cito/match/analyze', data);
