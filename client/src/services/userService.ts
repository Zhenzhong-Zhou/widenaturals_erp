import axiosInstance from '@utils/axiosConfig.ts';
import { clearTokens } from '@utils/tokenManager.ts';
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts';
import { AppError, ErrorType } from '@utils/AppError.tsx';
import { AxiosError } from 'axios';
import { UserProfile } from '../features/user/state/userTypes.ts';

const API_ENDPOINTS = {
  USER_PROFILE: '/users/me',
};

// Type guard to check if error is an AxiosError
const isAxiosError = (error: unknown): error is AxiosError => {
  return (error as AxiosError).isAxiosError !== undefined;
};

/**
 * Fetches the authenticated user's profile.
 *
 * @returns {Promise<Object>} - The user's profile data.
 * @throws {AppError} - If the request fails or returns an unexpected response.
 */
const fetchUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_PROFILE);
    // Validate the response structure
    if (!response.data || typeof response.data !== 'object') {
      throw new AppError('Unexpected response format', 400, {
        type: ErrorType.ValidationError,
      });
    }
    
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      // Specific handling for unauthorized errors (401)
      if (err.response?.status === 401) {
        clearTokens();
        throw new AppError('Unauthorized. Please log in again.', 401, {
          type: ErrorType.AuthenticationError,
        });
      }
    }
    
    const mappedError = mapErrorMessage(err);
    handleError(mappedError);
    
    throw mappedError;
  }
};

/**
 * Exported user service object.
 */
export const userService = {
  fetchUserProfile,
};
