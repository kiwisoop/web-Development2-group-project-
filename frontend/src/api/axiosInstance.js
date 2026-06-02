import axios from 'axios';

const apiHost = window.location.hostname || 'localhost';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: configuredBaseUrl || `http://${apiHost}:8080/api`,
  withCredentials: true,
});

export default axiosInstance;
