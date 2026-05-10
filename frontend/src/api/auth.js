import { api } from './client'

export const register = (data) => api.post('/auth/register', data).then(r => r.data)
export const login = (data) => api.post('/auth/login', data).then(r => r.data)

// Tiny session helpers; stored in localStorage for simplicity.
const KEY = 'sa_user'
export const saveUser = (u) => localStorage.setItem(KEY, JSON.stringify(u))
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
export const clearUser = () => localStorage.removeItem(KEY)
