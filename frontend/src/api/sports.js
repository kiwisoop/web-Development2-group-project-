import { api } from './client'
export const fetchSports = () => api.get('/sports').then(r => r.data)
