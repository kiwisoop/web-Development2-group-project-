import axiosInstance from './axiosInstance';

export const getFixtures = (params, signal) =>
  axiosInstance.get('/soccer/fixtures', { params, signal });

export const getFixture = (fixtureId, signal) =>
  axiosInstance.get(`/soccer/fixtures/${fixtureId}`, { signal });

export const getStandings = (season, signal) =>
  axiosInstance.get('/soccer/standings', { params: { season }, signal });

export const getSoccerTeams = (signal) =>
  axiosInstance.get('/soccer/teams', { signal });

export const getSoccerTeam = (teamId, signal) =>
  axiosInstance.get(`/soccer/teams/${teamId}`, { signal });

// ───── AI 분석 (Gemini) ─────
export const getFixtureAnalysis = (fixtureId, signal) =>
  axiosInstance.get(`/soccer/fixtures/${fixtureId}/analysis`, { signal });

export const generateFixtureAnalysis = (fixtureId) =>
  axiosInstance.post(`/soccer/fixtures/${fixtureId}/analysis/generate`);

export const regenerateFixtureAnalysis = (fixtureId) =>
  axiosInstance.post(`/soccer/fixtures/${fixtureId}/analysis/regenerate`);
