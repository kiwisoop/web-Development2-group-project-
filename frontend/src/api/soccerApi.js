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
