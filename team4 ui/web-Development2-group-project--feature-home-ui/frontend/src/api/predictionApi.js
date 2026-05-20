import axiosInstance from './axiosInstance';

export const getPredictionResult = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/prediction`, { signal });

export const votePrediction = (matchId, voteOption) =>
  axiosInstance.post(`/matches/${matchId}/prediction/vote`, { voteOption });
