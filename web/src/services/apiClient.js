import axios from 'axios';

// Relative baseURL only: the front never crosses origin (see
// docs/04-CONTRATO-API.md and vite.config.js / nginx.conf for how "/api"
// resolves to the api container in both dev and delivery).
const apiClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url === '/auth/login';
    const isOnLoginPage = window.location.pathname === '/login';

    if (status === 401 && !isLoginRequest && !isOnLoginPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
