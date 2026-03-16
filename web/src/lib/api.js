import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints that should never trigger the refresh/redirect logic
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

// On 401: attempt token refresh once, then redirect to /login
// Skip entirely for auth endpoints so login errors reach the component catch block
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const url = err.config?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));

    if (err.response?.status === 401 && !err.config._retry && !isAuthEndpoint) {
      err.config._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/refresh',
            { refreshToken }
          );
          localStorage.setItem('token', data.token);
          err.config.headers.Authorization = `Bearer ${data.token}`;
          return api(err.config);
        } catch {
          // refresh failed — fall through to clear + redirect
        }
      }
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
