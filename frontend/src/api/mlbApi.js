import axiosInstance from './axiosInstance';

export const syncMlbSchedule = (startDate, endDate) =>
  axiosInstance.post('/admin/mlb/sync/schedule', { startDate, endDate });

export const getMlbGameDetail = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/mlb-detail`, { signal });

export const getMlbPlayByPlay = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/mlb-play-by-play`, { signal });
