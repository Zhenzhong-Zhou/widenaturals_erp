import axiosInstance from '../utils/axiosConfig';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import { AppError, ErrorType } from '../utils/AppError';
import { clearTokens, getToken } from '../utils/tokenManager';

const API_ENDPOINTS = {
  LOGIN: '/session/login',
  REFRESH_TOKEN: '/session/refresh',
};

// In-memory storage for the current CSRF token
let csrfToken: string | null = null;

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
  if (!email || !password) {
    throw new AppError('Email and password are required', 400, {
      type: ErrorType.ValidationError,
      details: 'Both email and password must be provided',
    });
  }

  try {
    const response = await axiosInstance.post<LoginResponse>(
      API_ENDPOINTS.LOGIN,
      { email, password }
    );

    // Set the access token in the Authorization header for subsequent requests
    axiosInstance.defaults.headers.common['Authorization'] =
      `Bearer ${response.data.accessToken}`;

    // Update CSRF token with the new token from login response
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
    throw appError; // Re-throw to let the caller handle it
  }
};

const refreshToken = async (): Promise<{ accessToken: string }> => {
  try {
    // Attempt to refresh the access token
    const response = await axiosInstance.post<{ accessToken: string }>(
      API_ENDPOINTS.REFRESH_TOKEN,
      {}, // Body is empty since the refresh token is in HttpOnly cookie
      {
        headers: {
          Authorization: `Bearer ${getToken('accessToken')}`, // Include the current access token in the headers
        },
        withCredentials: true, // Ensure cookies are sent with the request
      }
    );

    // Update Axios headers to use the new access token for subsequent requests
    axiosInstance.defaults.headers.common['Authorization'] =
      `Bearer ${response.data.accessToken}`;

    return { accessToken: response.data.accessToken };
  } catch (error: unknown) {
    // Log the error and handle session expiration
    handleError(error);
    clearTokens(); // Clear any remaining tokens
    window.location.href = '/login?expired=true'; // Redirect to login with an expired session indicator
    throw new AppError('Token refresh failed', 401, {
      type: ErrorType.GlobalError,
      details: mapErrorMessage(error),
    });
  }
};

export const sessionService = {
  login,
  refreshToken,
};
