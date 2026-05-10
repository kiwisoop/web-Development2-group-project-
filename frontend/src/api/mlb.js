import { api } from './client'

// React calls our Spring Boot backend, not MLB directly.
export const fetchMlbSchedule = (date) =>
  api.get('/mlb/schedule', { params: date ? { date } : {} }).then(r => r.data)

export const fetchMlbMonthSchedule = (year, month) =>
  api.get('/mlb/schedule/month', { params: { year, month } }).then(r => r.data)

export const fetchMlbGameDetail = (gamePk) =>
  api.get(`/mlb/game/${gamePk}`).then(r => r.data)

export const fetchMlbMockSummary = (gamePk) =>
  api.get(`/mlb/game/${gamePk}/summary/mock`).then(r => r.data)

export const fetchMlbGeminiSummary = (gamePk) =>
  api.get(`/mlb/game/${gamePk}/summary/gemini`).then(r => r.data)

export const fetchMlbSummaryCompare = (gamePk) =>
  api.get(`/mlb/game/${gamePk}/summary/compare`).then(r => r.data)

// Records / standings / leaders
export const fetchMlbStandings = (season) =>
  api.get('/mlb/records/standings', { params: { season } }).then(r => r.data)

export const fetchMlbHittingLeaders = (season, limit = 10) =>
  api.get('/mlb/records/leaders/hitting', { params: { season, limit } }).then(r => r.data)

export const fetchMlbPitchingLeaders = (season, limit = 10) =>
  api.get('/mlb/records/leaders/pitching', { params: { season, limit } }).then(r => r.data)

export const fetchMlbRecordsDashboard = (season, limit = 10) =>
  api.get('/mlb/records/dashboard', { params: { season, limit } }).then(r => r.data)
