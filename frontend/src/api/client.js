import axios from 'axios'

// Single axios instance reused by all API modules.
// Spring Boot runs on :8080 by default.
export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})
