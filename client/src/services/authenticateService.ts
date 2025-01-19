import axiosInstance from '../utils/axiosConfig';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import { AppError, ErrorType } from '../utils/AppError';
import { setTokens, clearTokens, getToken } from '../utils/tokenManager';

const API_ENDPOINTS = {
  LOGIN: '/session/login',
  REFRESH_TOKEN: '/session/refresh',
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
    throw new AppError('Email and password are required', 400, {
      type: ErrorType.ValidationError,
      details: 'Both email and password must be provided',
    });
  }
  try {
    const response = await axiosInstance.post<LoginResponse>(API_ENDPOINTS.LOGIN, { email, password });
    setTokens(response.data.accessToken);
    return response.data;
  } catch (error: unknown) {
    handleError(error);
    throw new AppError('Login failed', 400, {
      type: ErrorType.ValidationError,
      details: mapErrorMessage(error),
    });
  }
};

const refreshToken = async (): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const storedRefreshToken = getToken('refreshToken');
    if (!storedRefreshToken) {
      clearTokens();
      window.location.href = '/login?expired=true';
      throw new AppError('Refresh token is missing', 401, {
        type: ErrorType.ValidationError,
        details: 'No refresh token found in storage',
      });
    }
    
    const response = await axiosInstance.post<{ accessToken: string; refreshToken: string }>(
      API_ENDPOINTS.REFRESH_TOKEN,
      { refreshToken: storedRefreshToken }
    );
    
    setTokens(response.data.accessToken);
    return response.data;
  } catch (error: unknown) {
    handleError(error);
    clearTokens();
    window.location.href = '/login?expired=true';
    throw new AppError('Token refresh failed', 401, {
      type: ErrorType.GlobalError,
      details: mapErrorMessage(error),
    });
  }
};

const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post(API_ENDPOINTS.LOGOUT);
    clearTokens();
  } catch (error: unknown) {
    handleError(error);
    clearTokens(); // Ensure client tokens are cleared
    console.warn('Server logout failed, clearing client tokens only.');
    throw new AppError('Logout failed', 500, {
      type: ErrorType.UnknownError,
      details: mapErrorMessage(error),
    });
  }
};

export const authService = {
  login,
  refreshToken,
  logout,
};
