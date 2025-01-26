import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { AppError, ErrorType } from '@utils/AppError.tsx';
import { handleError } from '@utils/errorUtils';
import {
  selectCsrfToken,
  selectCsrfError,
  selectCsrfStatus,
} from '../features/csrf/state/csrfSelector';
import { store } from '../store/store';
import { resetCsrfToken } from '../features/csrf/state/csrfSlice';
import { sessionService } from '../services';
import { updateAccessToken } from '../features/session/state/sessionSlice.ts';
import { selectAccessToken } from '../features/session/state/sessionSelectors.ts';
import { withRetry } from '@utils/retryUtils.ts';

interface ErrorResponse {
  message?: string;
  [key: string]: any; // Optional for additional properties
}

const baseURL = import.meta.env.VITE_BASE_URL;

// Create Axios instance
const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Refreshing tokens and retry logic
let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

// Process queued requests during token refresh
const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const state = store.getState();
      const csrfToken = selectCsrfToken(state);
      const accessToken = selectAccessToken(state);
      
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
      
      return config;
    } catch (error) {
      handleError(error); // Log error using handleError
      throw new AppError('Error in request interceptor', 500, {
        type: ErrorType.NetworkError,
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  (error: AxiosError<ErrorResponse>) => {
    handleError(error);
    return Promise.reject(
      new AppError('Request interceptor error', 500, {
        type: ErrorType.NetworkError,
        details: error.message,
      })
    );
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const state = store.getState();
    const csrfToken = selectCsrfToken(state);
    const csrfError = selectCsrfError(state);
    const csrfStatus = selectCsrfStatus(state);
    
    try {
      // Handle CSRF errors
      if (csrfStatus === 'failed' && csrfError) {
        console.error('CSRF Error detected:', csrfError);
        store.dispatch(resetCsrfToken());
        throw new AppError('CSRF token error', 403, {
          type: ErrorType.GlobalError,
          details: csrfError,
        });
      }
      
      // Handle token expiration (401)
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                originalRequest.headers['X-CSRF-Token'] = csrfToken;
              }
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          // Request new access token
          const { accessToken } = await sessionService.refreshToken();
          store.dispatch(updateAccessToken(accessToken));
          
          // Process queued requests with the new token
          processQueue(null, accessToken);
          
          // Retry the original request with updated tokens
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            originalRequest.headers['X-CSRF-Token'] = csrfToken;
          }
          
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          if (refreshError instanceof AxiosError) {
            processQueue(refreshError, null); // Pass AxiosError
          } else {
            processQueue(null, null); // Handle non-AxiosError scenarios gracefully
          }
          throw new AppError('Token refresh failed, please log in again', 401);
        } finally {
          isRefreshing = false;
        }
      }
      
      // Retry logic using `withRetry`
      if (error.response?.status === 429 || !error.response) {
        const retryAfter = parseInt(
          error.response?.headers?.['retry-after'] || '1000',
          10
        );
        return withRetry(
          () => axiosInstance(originalRequest),
          5,
          retryAfter,
          'Rate-limited or network error. Retrying...'
        );
      }
      
      // Convert server errors (500+) to AppError
      if (error.response?.status >= 500) {
        throw AppError.create(
          ErrorType.ServerError,
          'Server error occurred',
          error.response.status,
          { details: error.response.data }
        );
      }
      
      // Handle validation errors (400)
      if (error.response?.status === 400) {
        throw AppError.create(
          ErrorType.ValidationError,
          'Validation failed',
          400,
          { details: error.response.data }
        );
      }
      
      // Convert unknown errors to AppError
      throw AppError.create(
        ErrorType.UnknownError,
        'An unknown error occurred',
        error.response?.status || 500,
        { details: error.response?.data || error.message }
      );
    } catch (appError) {
      handleError(appError);
      return Promise.reject(appError);
    }
  }
);

export default axiosInstance;
