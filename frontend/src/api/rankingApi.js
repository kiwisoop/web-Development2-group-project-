import axiosInstance from './axiosInstance';

export const getRankings = (sportType, season, signal) =>
  axiosInstance.get(`/rankings/${sportType}`, { params: { season }, signal });
