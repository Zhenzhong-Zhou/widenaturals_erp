import axiosInstance from '../utils/axiosConfig';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import AppError from '../utils/AppError';
import { setTokens, clearTokens, getToken } from '../utils/tokenManager';

const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
};

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

const login = async (email: string, password: string): Promise<LoginResponse> => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'ValidationError');
  }
  try {
    const response = await axiosInstance.post<LoginResponse>(API_ENDPOINTS.LOGIN, { email, password });
    setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  } catch (error: unknown) {
    handleError(error);
    throw new AppError(mapErrorMessage(error), 400, 'ValidationError');
  }
};

const refreshToken = async (): Promise<{ accessToken: string }> => {
  try {
    const storedRefreshToken = getToken('refreshToken');
    if (!storedRefreshToken) {
      clearTokens();
      window.location.href = '/login';
      throw new AppError('Refresh token is missing', 401, 'ValidationError');
    }
    const response = await axiosInstance.post<{ accessToken: string }>(API_ENDPOINTS.REFRESH_TOKEN, { refreshToken: storedRefreshToken });
    setTokens(response.data.accessToken, storedRefreshToken);
    return response.data;
  } catch (error: unknown) {
    handleError(error);
    clearTokens(); // Clear tokens on failure
    window.location.href = '/login'; // Redirect user to login page
    throw new AppError(mapErrorMessage(error), 401, 'GlobalError');
  }
};

const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post(API_ENDPOINTS.LOGOUT);
    clearTokens();
  } catch (error: unknown) {
    handleError(error);
    throw new AppError(mapErrorMessage(error), 500, 'UnknownError');
  }
};

export const authService = {
  login,
  refreshToken,
  logout,
};
