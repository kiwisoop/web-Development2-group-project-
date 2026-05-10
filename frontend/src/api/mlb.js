import { api } from './client'

// React calls our Spring Boot backend, not MLB directly.
export const fetchMlbSchedule = (date) =>
  api.get('/mlb/schedule', { params: date ? { date } : {} }).then(r => r.data)

export const fetchMlbGameDetail = (gamePk) =>
  api.get(`/mlb/game/${gamePk}`).then(r => r.data)
