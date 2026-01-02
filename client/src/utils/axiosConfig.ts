import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as axiosRetry from 'axios-retry';
import { store } from '@store/store';
import { AppError } from '@utils/error';
import { selectAccessToken } from '@features/session/state/sessionSelectors';
import { updateAccessToken } from '@features/session/state/sessionSlice';
import { logoutThunk } from '@features/session/state/sessionThunks';
import { selectCsrfToken } from '@features/csrf/state/csrfSelector';
import { sessionService } from '@services/sessionService';

interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

const baseURL = import.meta.env.VITE_BASE_URL;

/* =========================================================
 * Axios instance
 * ======================================================= */

const axiosInstance = axios.create({
  baseURL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

/* =========================================================
 * Retry (transport-level only)
 * ======================================================= */

axiosRetry.default(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount, error) => {
    const retryAfter = error.response?.headers?.['retry-after'];
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (!Number.isNaN(seconds)) {
        return seconds * 1000;
      }
    }
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) ||
    error.response?.status === 429 ||
    (error.response?.status ?? 0) >= 500,
});

/* =========================================================
 * Refresh token single-flight
 * ======================================================= */

let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token as string);
  });
  failedQueue = [];
};

/* =========================================================
 * Request interceptor
 * ======================================================= */

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
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
});

/* =========================================================
 * Response interceptor
 * ======================================================= */

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    /* ----------------------------------
     * 401 → refresh & replay
     * ---------------------------------- */

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosInstance(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken } = await sessionService.refreshToken();
        store.dispatch(updateAccessToken(accessToken));

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logoutThunk());
        window.location.href = '/login';

        return Promise.reject(
          AppError.authentication('Session expired. Please log in again.')
        );
      } finally {
        isRefreshing = false;
      }
    }

    /* ----------------------------------
     * HTTP → AppError normalization
     * ---------------------------------- */

    const status = error.response?.status;
    const message = error.response?.data?.message;

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
      AppError.unknown(message || 'Unexpected error occurred', error)
    );
  }
);

export default axiosInstance;
