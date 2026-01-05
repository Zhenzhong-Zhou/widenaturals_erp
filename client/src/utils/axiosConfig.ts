import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as axiosRetry from 'axios-retry';
import { store } from '@store/store';
import { AppError } from '@utils/error';
import {
  selectAccessToken,
} from '@features/session/state/loginSelectors';
import { selectCsrfToken } from '@features/csrf/state/csrfSelector';

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
  (response: AxiosResponse) => response,
  (error: AxiosError<ErrorResponse>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    
    if (status === 401) {
      return Promise.reject(
        AppError.authentication('Unauthorized')
      );
    }
    
    if (status === 400) {
      return Promise.reject(
        AppError.validation('Validation failed', error.response?.data)
      );
    }
    
    if (status === 429) {
      return Promise.reject(
        AppError.rateLimit('Too many requests')
      );
    }
    
    if (status && status >= 500) {
      return Promise.reject(
        AppError.server('Server error occurred', error.response?.data)
      );
    }
    
    return Promise.reject(
      AppError.unknown(message || 'Unexpected error occurred', error)
    );
  }
);

export default axiosInstance;
