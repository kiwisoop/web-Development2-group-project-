import { api } from './client'

export const fetchAnalysis = (matchId) =>
  api.get(`/matches/${matchId}/analysis`).then(r => r.data)

export const generateAnalysis = (matchId) =>
  api.post(`/matches/${matchId}/analysis`).then(r => r.data)
