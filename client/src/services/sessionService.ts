import axiosInstance from '../utils/axiosConfig';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import { AppError, ErrorType } from '../utils/AppError';
import { clearTokens, getToken } from '../utils/tokenManager';
import { withRetry } from '../utils/retryUtils';
import { withTimeout } from '../utils/timeoutUtils';
import { selectCsrfToken } from '../features/csrf/state/csrfSelector.ts';
import { store } from '../store/store.ts';
import { logoutThunk } from '../features/session/state/sessionThunks.ts';

const API_ENDPOINTS = {
  LOGIN: '/session/login',
  REFRESH_TOKEN: '/session/refresh',
  LOGOUT: '/auth/logout',
};

interface LoginResponse {
  accessToken: string;
  csrfToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  lastLogin: string;
}

/**
 * Authenticate a user by email and password.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<LoginResponse>} A promise resolving to the user's session details, including access token, csrf token, and user information.
 * @throws {AppError} Throws an AppError for validation errors or failed login attempts.
 */
const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  let csrfToken: string | null = null;
  if (!email || !password) {
    throw new AppError('Email and password are required', 400, {
      type: ErrorType.ValidationError,
      details: 'Both email and password must be provided',
    });
  }

  try {
    const response = await withRetry(
      () =>
        withTimeout(
          axiosInstance.post<LoginResponse>(API_ENDPOINTS.LOGIN, {
            email,
            password,
          }),
          5000, // Timeout in milliseconds
          'Login request timed out'
        ),
      3, // Retry attempts
      1000, // Delay between retries in milliseconds
      'Failed to login after retries'
    );

    // Set the access token in the Authorization header for subsequent requests
    axiosInstance.defaults.headers.common['Authorization'] =
      `Bearer ${response.data.accessToken}`;

    // Update CSRF token
    csrfToken = response.data.csrfToken;

    // Replace the CSRF token in axios headers for subsequent requests
    axiosInstance.defaults.headers.common['X-CSRF-Token'] = csrfToken;

    return response.data;
  } catch (error: unknown) {
    const appError = new AppError('Login failed', 401, {
      type: ErrorType.NetworkError,
      details: mapErrorMessage(error),
    });

    handleError(appError);
    throw appError;
  }
};

let refreshAttemptCount = 0;
const MAX_REFRESH_ATTEMPTS = 3;

/**
 * Refresh the user's access token.
 */
const refreshToken = async (): Promise<{ accessToken: string }> => {
  if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
    throw new AppError('Exceeded maximum token refresh attempts', 401, {
      type: ErrorType.AuthenticationError,
    });
  }
  
  try {
    refreshAttemptCount += 1;
    const state = store.getState();
    const csrfToken = selectCsrfToken(state);
    
    const response =
      await axiosInstance.post<{ accessToken: string }>(
        API_ENDPOINTS.REFRESH_TOKEN,
        {
          headers: {
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken('accessToken')}`,
          },
          withCredentials: true,
      });
    
    // Update Axios headers to use the new access token
    axiosInstance.defaults.headers.common['Authorization'] =
      `Bearer ${response.data.accessToken}`;
    
    refreshAttemptCount = 0; // Reset attempt count on success
    return { accessToken: response.data.accessToken };
  } catch (error: unknown) {
    // Log the error and handle session expiration
    handleError(error);
    
    // Call logoutThunk via store.dispatch
    await store.dispatch(logoutThunk());
    
    // Redirect to login
    window.location.href = '/login?expired=true';
    
    // Throw an application-level error
    throw new AppError('Token refresh failed', 401, {
      type: ErrorType.GlobalError,
      details: mapErrorMessage(error),
    });
  }
};

/**
 * Log out the user and clear session data.
 */
const logout = async (): Promise<void> => {
  try {
    await withTimeout(
      axiosInstance.post(API_ENDPOINTS.LOGOUT),
      5000, // Timeout in milliseconds
      'Logout request timed out'
    );

    clearTokens();
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error);
    throw new AppError('Logout failed. Please try again.', 500, {
      type: ErrorType.NetworkError,
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const sessionService = {
  login,
  refreshToken,
  logout,
};
