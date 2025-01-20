import axiosInstance from '@utils/axiosConfig.ts';
import { clearTokens } from '@utils/tokenManager.ts';
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts';
import { AppError, ErrorType } from '@utils/AppError.tsx';

const API_ENDPOINTS = {
  LOGOUT: '/auth/logout',
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
  logout,
};
