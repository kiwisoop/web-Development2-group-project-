import { api } from './client'

export const fetchFavorites = (userId) =>
  api.get('/favorites/teams', { params: { userId } }).then(r => r.data)

export const addFavorite = (payload) =>
  api.post('/favorites/teams', payload).then(r => r.data)

export const removeFavorite = (id) =>
  api.delete(`/favorites/teams/${id}`).then(r => r.data)
