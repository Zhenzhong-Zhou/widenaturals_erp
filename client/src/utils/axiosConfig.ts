import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { AppError, ErrorType } from './AppError'; // Updated AppError
import { handleError, mapErrorMessage } from './errorUtils'; // Error utilities
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

interface ErrorResponse {
  message?: string;
  [key: string]: any; // Optional for additional properties
}

const baseURL = import.meta.env.VITE_BASE_URL;

// Create Axios instance
const axiosInstance = axios.create({
  baseURL,
  timeout: 10000, // Request timeout
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

/**
 * Process queued requests during token refresh.
 *
 * @param error - The error if token refresh fails.
 * @param token - The new token if refresh is successful.
 */
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

// Request interceptor: Add auth token and CSRF token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const state = store.getState(); // Access the Redux store directly
      const csrfToken = selectCsrfToken(state); // Get the CSRF token from the store
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
  (error: AxiosError) => {
    handleError(error);
    return Promise.reject(
      new AppError('Request interceptor error', 500, {
        type: ErrorType.NetworkError,
        details: error.message,
      })
    );
  }
);

// Response interceptor: Handle token expiration, retry logic, and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const state = store.getState(); // Access the Redux state
    const csrfToken = selectCsrfToken(state);
    const csrfError = selectCsrfError(state); // Retrieve CSRF error state
    const csrfStatus = selectCsrfStatus(state); // Retrieve CSRF status state

    try {
      // Handle CSRF-specific errors
      if (csrfStatus === 'failed' && csrfError) {
        console.error('CSRF Error detected:', csrfError);
        store.dispatch(resetCsrfToken()); // Reset CSRF state
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
        
        // Request new access token
        const { accessToken } = await sessionService.refreshToken();
        
        store.dispatch(updateAccessToken(accessToken)); // Synchronize Redux state
        
        // Process queued requests with the new token
        processQueue(null, accessToken);
        // Retry the original request with updated tokens
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          originalRequest.headers['X-CSRF-Token'] = csrfToken;
        }

        return axiosInstance(originalRequest);
      }

      // Retry logic for rate-limiting (429) or network errors
      if (error.response?.status === 429 || !error.response) {
        const retryAfter = parseInt(
          error.response?.headers?.['retry-after'] || '1000',
          10
        );
        console.warn('Rate limited or network error, retrying...');
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return axiosInstance(originalRequest);
      }

      // Handle server errors (500+)
      if (error.response?.status >= 500) {
        throw new AppError('Server error', error.response.status, {
          type: ErrorType.GlobalError,
          details: mapErrorMessage(error),
        });
      }

      // Handle validation errors (400)
      if (error.response?.status === 400) {
        throw new AppError('Validation error', 400, {
          type: ErrorType.ValidationError,
          details: mapErrorMessage(error),
        });
      }

      // Unknown error
      throw new AppError(
        'Unknown error occurred',
        error.response?.status || 500,
        {
          type: ErrorType.UnknownError,
          details: mapErrorMessage(error),
        }
      );
    } catch (appError) {
      handleError(appError); // Log the AppError
      return Promise.reject(appError);
    } finally {
      if (isRefreshing) {
        isRefreshing = false;
      }
    }
  }
);

export default axiosInstance;
