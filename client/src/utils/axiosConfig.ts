import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as axiosRetry from 'axios-retry';
import { rawAxios } from '@utils/http';
import { AppError } from '@utils/error';
import { AppErrorDetails } from '@utils/error/AppError';
import { store } from '@store/store';
import { selectAccessToken } from '@features/session/state/sessionSelectors';
import { selectCsrfToken } from '@features/csrf/state/csrfSelector';
import { setAccessToken } from '@features/session/state/sessionSlice';
import { sessionService } from '@services/sessionService';
import { hardLogout } from '@features/session/utils/hardLogout';

/* =========================================================
 * Refresh control (single-flight)
 * ======================================================= */

let refreshPromise: Promise<string> | null = null;

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
 * Retry — transport-level only
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
 * Response interceptor — auth-safe error handling
 * ======================================================= */

axiosInstance.interceptors.response.use(
  (response) => response,
  
  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(
        AppError.network('Request failed before reaching the server')
      );
    }
    
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    
    const status = error.response?.status;
    
    /* -------------------------------------------------------
     * 401 — attempt refresh (single-flight)
     * ----------------------------------------------------- */
    
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        if (!refreshPromise) {
          refreshPromise = sessionService
            .refreshToken()
            .then((data) => {
              if (!data?.accessToken) {
                throw AppError.authentication('Session expired');
              }
              
              store.dispatch(setAccessToken(data.accessToken));
              return data.accessToken;
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
        return Promise.reject(error);
      }
    }
    
    /* -------------------------------------------------------
     * 403 — permission revoked (runtime only)
     * ----------------------------------------------------- */
    
    if (status === 403) {
      await hardLogout();
      return Promise.reject(
        AppError.authorization('Access revoked. Please log in again.')
      );
    }
    
    /* -------------------------------------------------------
     * Normalization (non-auth)
     * ----------------------------------------------------- */
    
    if (status === 400) {
      return Promise.reject(
        AppError.validation(
          'Validation failed',
          error.response?.data as Record<string, unknown> | undefined
        )
      );
    }
    
    if (status === 404) {
      return Promise.reject(
        AppError.notFound(
          (error.response?.data as any)?.message ?? 'Resource not found'
        )
      );
    }
    
    if (status === 429) {
      return Promise.reject(AppError.rateLimit('Too many requests'));
    }
    
    if (status && status >= 500) {
      return Promise.reject(
        AppError.server(
          'Server error occurred',
          error.response?.data as AppErrorDetails | undefined
        )
      );
    }
    
    return Promise.reject(
      AppError.unknown(
        (error.response?.data as any)?.message ||
        'Unexpected error occurred',
        error
      )
    );
  }
);

export default axiosInstance;
