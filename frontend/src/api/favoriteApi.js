import axiosInstance from './axiosInstance';

export const getFavoriteTeams = (signal) =>
  axiosInstance.get('/favorites', { signal });

export const addFavoriteTeam = (teamId, signal) =>
  axiosInstance.post('/favorites', null, { params: { teamId }, signal });

export const removeFavoriteTeam = (favoriteId, signal) =>
  axiosInstance.delete(`/favorites/${favoriteId}`, { signal });
