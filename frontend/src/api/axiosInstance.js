import axios from 'axios';

const apiHost = window.location.hostname || 'localhost';

const axiosInstance = axios.create({
  baseURL: `http://${apiHost}:8080/api`,
  withCredentials: true,
});

export default axiosInstance;
