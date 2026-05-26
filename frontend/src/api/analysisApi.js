import axiosInstance from './axiosInstance';

export const getMatchAnalysis = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/analysis`, { signal });

export const generateMatchAnalysis = (matchId) =>
  axiosInstance.post(`/matches/${matchId}/analysis/generate`);

export const regenerateMatchAnalysis = (matchId) =>
  axiosInstance.post(`/matches/${matchId}/analysis/regenerate`);
