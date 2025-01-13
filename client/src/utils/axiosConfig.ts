import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie'; // Library to manage cookies

interface ErrorResponse {
  message?: string;
  [key: string]: any; // Optional for additional properties
}

// Base URL from environment variables
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Fallback for local development

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
    const accessToken = Cookies.get('accessToken');
    const csrfToken = Cookies.get('csrfToken');
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle token expiration, retry logic, and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue failed requests while refreshing
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
      
      try {
        const refreshToken = Cookies.get('refreshToken'); // Refresh token from cookies
        if (!refreshToken) {
          throw new Error('Refresh token missing');
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
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        localStorage.removeItem('accessToken'); // Optional cleanup
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Retry Logic for network errors or 429 (Too Many Requests)
    if (error.response?.status === 429 || !error.response) {
      const retryAfter = error.response?.headers['retry-after'] || 1000; // Default retry after 1 second
      console.warn('Rate limited or network error, retrying...');
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      return axiosInstance(originalRequest);
    }
    
    // Handle server errors (500+)
    if (error.response?.status >= 500) {
      console.error('Server Error:', error.message || 'An error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
