import { api } from './client'

export const fetchMatches = (sportType) =>
  api.get('/matches', { params: sportType ? { sportType } : {} }).then(r => r.data)

export const fetchMatch = (id) => api.get(`/matches/${id}`).then(r => r.data)
export const fetchStats = (id) => api.get(`/matches/${id}/stats`).then(r => r.data)
export const fetchEvents = (id) => api.get(`/matches/${id}/events`).then(r => r.data)
