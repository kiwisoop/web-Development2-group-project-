import axiosInstance from './axiosInstance';

export const getMatches = (params, signal) => axiosInstance.get('/matches', { params, signal });

export const getMatch = (matchId, signal) => axiosInstance.get(`/matches/${matchId}`, { signal });

export const getMatchStats = (matchId, signal) => axiosInstance.get(`/matches/${matchId}/stats`, { signal });

export const getMatchEvents = (matchId, signal) => axiosInstance.get(`/matches/${matchId}/events`, { signal });

export const getMatchDetailFull = (matchId, signal) => axiosInstance.get(`/matches/${matchId}/detail-full`, { signal });

export const getMatchSections = (params, signal) =>
  axiosInstance.get('/matches/sections', { params, signal });
