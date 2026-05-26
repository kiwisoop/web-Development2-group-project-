import axiosInstance from './axiosInstance';

export const getAdminDashboard = (signal) =>
  axiosInstance.get('/admin/dashboard', { signal });
