import axiosInstance from './axiosInstance';

export const getAdminDashboard = (signal) =>
  axiosInstance.get('/admin/dashboard', { signal });

export const syncSoccerFixtures = (startDate, endDate) =>
  axiosInstance.post('/admin/soccer/sync/fixtures', { startDate, endDate });

export const syncEsportsSchedule = (startDate, endDate) =>
  axiosInstance.post('/admin/esports/sync/schedule', { startDate, endDate });
