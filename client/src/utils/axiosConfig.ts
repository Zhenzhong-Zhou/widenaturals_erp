import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as axiosRetry from 'axios-retry';
import { store } from '@store/store';
import { AppError, ErrorType } from '@utils/AppError';
import { handleError } from '@utils/errorUtils';
import { selectAccessToken } from '@features/session/state/sessionSelectors';
import { updateAccessToken } from '@features/session/state/sessionSlice';
import { logoutThunk } from '@features/session/state/sessionThunks';
import { selectCsrfToken } from '@features/csrf/state/csrfSelector';
import { sessionService } from '@services/sessionService';

interface ErrorResponse {
  message?: string;
  [key: string]: any;
}

const baseURL = import.meta.env.VITE_BASE_URL;

/* -------------------------------------------------------------------------- */
/* Axios instance                                                             */
/* -------------------------------------------------------------------------- */

const axiosInstance = axios.create({
  baseURL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/* -------------------------------------------------------------------------- */
/* HTTP retry (transport-level only)                                          */
/* -------------------------------------------------------------------------- */

axiosRetry.default(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount, error) => {
    const retryAfter = error.response?.headers?.['retry-after'];
    
    // Retry-After may be seconds or a date string
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

/* -------------------------------------------------------------------------- */
/* Token refresh single-flight logic                                          */
/* -------------------------------------------------------------------------- */

let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}[] = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error as AxiosError);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

/* -------------------------------------------------------------------------- */
/* Request interceptor                                                        */
/* -------------------------------------------------------------------------- */

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
  },
  (error) => {
    handleError(error);
    return Promise.reject(error);
  }
);

/* -------------------------------------------------------------------------- */
/* Response interceptor                                                       */
/* -------------------------------------------------------------------------- */

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    
    /* ---------------------------------- */
    /* 401 → refresh token & replay       */
    /* ---------------------------------- */
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
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
        processQueue(
          axios.isAxiosError(refreshError) ? refreshError : null,
          null
        );
        
        store.dispatch(logoutThunk());
        window.location.href = '/login';
        
        return Promise.reject(
          AppError.create(
            ErrorType.AuthenticationError,
            'Session expired. Please log in again.',
            401
          )
        );
      } finally {
        isRefreshing = false;
      }
    }
    
    /* ---------------------------------- */
    /* Error normalization                */
    /* ---------------------------------- */
    
    const status = error.response?.status;
    
    if (status === 400) {
      return Promise.reject(
        AppError.create(
          ErrorType.ValidationError,
          'Validation failed',
          400,
          { details: error.response?.data }
        )
      );
    }
    
    if (typeof status === 'number' && status >= 500) {
      return Promise.reject(
        AppError.create(
          ErrorType.ServerError,
          'Server error occurred',
          status,
          { details: error.response?.data }
        )
      );
    }
    
    const appError = AppError.create(
      ErrorType.UnknownError,
      error.response?.data?.message || 'Unexpected error occurred',
      status ?? 500,
      { details: error.response?.data || error.message }
    );
    
    handleError(appError);
    return Promise.reject(appError);
  }
);

export default axiosInstance;
