import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as axiosRetry from 'axios-retry';
import { rawAxios } from '@utils/http';
import { AppError } from '@utils/error';
import { store } from '@store/store';
import { selectAccessToken } from '@features/session/state/loginSelectors';
import { selectCsrfToken } from '@features/csrf/state/csrfSelector';
import { sessionService } from '@services/sessionService';
import { setAccessToken } from '@features/session/state/sessionSlice';
import { hardLogout } from '@features/session/utils/hardLogout';

let refreshPromise: Promise<string> | null = null;

/* =========================================================
 * Types
 * ======================================================= */

interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

/* =========================================================
 * Axios instance
 * ======================================================= */

const baseURL = import.meta.env.VITE_BASE_URL;

const axiosInstance = axios.create({
  baseURL,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* =========================================================
 * Retry (transport-level only)
 * ======================================================= */

axiosRetry.default(axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) ||
    error.response?.status === 429 ||
    (error.response?.status ?? 0) >= 500,
});

/* =========================================================
 * Request interceptor — attach auth headers
 * ======================================================= */

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    
    const accessToken = selectAccessToken(state);
    const csrfToken = selectCsrfToken(state);
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  }
);

/* =========================================================
 * Response interceptor — error normalization only
 * ======================================================= */

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    if (!error.config) {
      return Promise.reject(
        AppError.network('Request failed before reaching the server')
      );
    }
    
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    
    const status = error.response?.status;
    
    // AUTH RECOVERY (highest priority)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        if (!refreshPromise) {
          refreshPromise = sessionService
            .refreshToken()
            .then(({ accessToken }) => {
              store.dispatch(setAccessToken(accessToken));
              return accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        
        const accessToken = await refreshPromise;
        
        originalRequest.headers = new AxiosHeaders(originalRequest.headers);
        originalRequest.headers.set(
          'Authorization',
          `Bearer ${accessToken}`
        );
        
        return rawAxios.request(originalRequest);
      } catch {
        await hardLogout();
        return Promise.reject(
          AppError.authentication('Session expired. Please log in again.')
        );
      }
    }
    
    // PERMISSION REVOKED
    if (status === 403) {
      await hardLogout();
      return Promise.reject(
        AppError.authorization('Access revoked. Please log in again.')
      );
    }
    
    // NORMALIZATION (final)
    if (status === 400) {
      return Promise.reject(
        AppError.validation('Validation failed', error.response?.data)
      );
    }
    
    if (status === 429) {
      return Promise.reject(AppError.rateLimit('Too many requests'));
    }
    
    if (status && status >= 500) {
      return Promise.reject(
        AppError.server('Server error occurred', error.response?.data)
      );
    }
    
    return Promise.reject(
      AppError.unknown(
        error.response?.data?.message || 'Unexpected error occurred',
        error
      )
    );
  }
);

export default axiosInstance;
