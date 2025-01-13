import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import AppError from './AppError'; // Custom AppError class
import { handleError, mapErrorMessage } from './errorUtils'; // Import global error utilities

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
});

// Refreshing tokens and retry logic
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

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
      const accessToken = Cookies.get('accessToken');
      const csrfToken = Cookies.get('csrfToken');
      
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
      
      return config;
    } catch (error) {
      handleError(error); // Log error using handleError
      throw AppError.fromNetworkError('Error in request interceptor');
    }
  },
  (error: AxiosError) => {
    handleError(error);
    return Promise.reject(AppError.fromNetworkError(error.message));
  }
);

// Response interceptor: Handle token expiration, retry logic, and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    try {
      // Handle token expiration (401)
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          throw AppError.fromValidationError('Refresh token is missing');
        }
        
        // Request new access token
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        
        // Save new tokens in cookies
        Cookies.set('accessToken', data.accessToken, { secure: true, sameSite: 'Strict' });
        Cookies.set('refreshToken', data.refreshToken, { secure: true, sameSite: 'Strict' });
        
        // Process queued requests with the new token
        processQueue(null, data.accessToken);
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${data.accessToken}`,
        };
        
        return axiosInstance(originalRequest);
      }
      
      // Retry logic for rate-limiting (429) or network errors
      if (error.response?.status === 429 || !error.response) {
        const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '1000', 10);
        console.warn('Rate limited or network error, retrying...');
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return axiosInstance(originalRequest);
      }
      
      // Handle server errors (500+)
      if (error.response?.status >= 500) {
        throw new AppError(
          mapErrorMessage(error), // Use mapErrorMessage for user-friendly messages
          error.response.status,
          'GlobalError'
        );
      }
      
      // Handle validation errors (400)
      if (error.response?.status === 400) {
        throw AppError.fromValidationError(mapErrorMessage(error));
      }
      
      // Unknown error
      throw new AppError(
        mapErrorMessage(error),
        error.response?.status || 500,
        'UnknownError'
      );
    } catch (appError) {
      handleError(appError); // Log the appError
      return Promise.reject(appError);
    } finally {
      if (isRefreshing) {
        isRefreshing = false;
      }
    }
  }
);

export default axiosInstance;
