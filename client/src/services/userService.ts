import axiosInstance from '@utils/axiosConfig.ts';
import { clearTokens } from '@utils/tokenManager.ts';
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts';
import { AppError, ErrorType } from '@utils/AppError.tsx';
import { UserResponse } from '../features/user/state/userTypes.ts';
import { isCustomAxiosError } from '@utils/axiosUtils.ts';
import { withTimeout } from '@utils/timeoutUtils.ts';
import { withRetry } from '@utils/retryUtils.ts';

const API_ENDPOINTS = {
  USER_PROFILE: '/users/me',
};

/**
 * Fetches the authenticated user's profile.
 *
 * @returns {Promise<Object>} - The user's profile data.
 * @throws {AppError} - If the request fails or returns an unexpected response.
 */
const fetchUserProfile = async (): Promise<UserResponse> => {
  try {
    const fetchProfile = () => axiosInstance.get<UserResponse>(API_ENDPOINTS.USER_PROFILE);
    // Add retry and timeout logic
    const response = await withTimeout(
      withRetry(fetchProfile, 3, 'Failed to fetch user profile after retries'),
      5000, // Timeout in milliseconds
      'Fetching user profile timed out'
    );
    
    if (!response.data || typeof response.data !== 'object') {
      throw new AppError('Unexpected response format', 400, {
        type: ErrorType.ValidationError,
      });
    }
    
    return response.data;
  } catch (err) {
    if (isCustomAxiosError(err) && err.response?.status === 401) {
      clearTokens();
      throw new AppError('Unauthorized. Please log in again.', 401, {
        type: ErrorType.AuthenticationError,
      });
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
