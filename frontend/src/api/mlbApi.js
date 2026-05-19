import axiosInstance from './axiosInstance';

export const syncMlbSchedule = (startDate, endDate) =>
  axiosInstance.post('/admin/mlb/sync/schedule', { startDate, endDate });
