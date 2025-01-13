import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import AppError from './AppError'; // Import AppError class

interface ErrorResponse {
  message?: string;
  [key: string]: any; // Optional for additional properties
}

const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

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

// Function to process queued requests during token refresh
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
      throw AppError.fromNetworkError('Error in request interceptor');
    }
  },
  (error: AxiosError) => {
    return Promise.reject(AppError.fromNetworkError(error.message));
  }
);

// Response interceptor: Handle token expiration, retry logic, and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    try {
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
      
      if (error.response?.status === 429 || !error.response) {
        const retryAfter = parseInt(error.response?.headers['retry-after'] || '1000', 10);
        console.warn('Rate limited or network error, retrying...');
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return axiosInstance(originalRequest);
      }
      
      if (error.response?.status >= 500) {
        throw new AppError(
          error.response.data?.message || 'Server Error',
          error.response.status,
          'GlobalError',
          'An unexpected server error occurred.'
        );
      }
      
      if (error.response?.status === 400) {
        throw AppError.fromValidationError(error.response.data?.message || 'Validation error occurred.');
      }
      
      throw new AppError(
        error.response?.data?.message || 'Unknown Error',
        error.response?.status || 500,
        'UnknownError',
        'An unexpected error occurred.'
      );
    } catch (appError) {
      if (appError instanceof AppError) {
        AppError.reportError(appError); // Optional: Log error to external service
      }
      return Promise.reject(appError);
    } finally {
      if (isRefreshing) {
        isRefreshing = false;
      }
    }
  }
);

export default axiosInstance;
