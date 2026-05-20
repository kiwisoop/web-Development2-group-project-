import axiosInstance from './axiosInstance';

export const getRankings = (sportType, signal) =>
  axiosInstance.get(`/rankings/${sportType}`, { signal });
