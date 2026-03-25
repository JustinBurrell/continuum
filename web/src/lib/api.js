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

// Single in-flight refresh promise — prevents concurrent 401s from each spawning
// their own refresh request. All failing requests queue behind the one refresh call.
let refreshPromise = null;

// Deduplicate 429 toasts — one notification per burst, 10 s cooldown
let rateLimitFired = false;

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// On 401: attempt token refresh once (shared across all concurrent requests),
// then redirect to /login if refresh fails.
// Skip entirely for auth endpoints so login errors reach the component catch block.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const url = err.config?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));

    if (err.response?.status === 429) {
      if (!rateLimitFired) {
        rateLimitFired = true;
        window.dispatchEvent(new CustomEvent('api:ratelimit'));
        setTimeout(() => { rateLimitFired = false; }, 10_000);
      }
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !err.config._retry && !isAuthEndpoint) {
      err.config._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        // Reuse an in-flight refresh if one is already running
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/refresh',
              { refreshToken }
            )
            .then(({ data }) => {
              localStorage.setItem('token', data.token);
              return data.token;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        try {
          const newToken = await refreshPromise;
          err.config.headers.Authorization = `Bearer ${newToken}`;
          return api(err.config);
        } catch {
          clearSession();
          return Promise.reject(err);
        }
      }

      clearSession();
    }
    return Promise.reject(err);
  }
);

export default api;
