import axiosInstance from '@utils/axiosConfig.ts';
import { clearTokens } from '@utils/tokenManager.ts';
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts';
import { AppError, ErrorType } from '@utils/AppError.tsx';
import { UserProfileResponse, UseUsersResponse } from '../features/user';
import { isCustomAxiosError } from '@utils/axiosUtils.ts';
import { withTimeout } from '@utils/timeoutUtils.ts';
import { withRetry } from '@utils/retryUtils.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';

/**
 * Fetches a list of all users from the API.
 *
 * @async
 * @function fetchUsers
 * @returns {Promise<User[] | null>} - A promise that resolves to an array of user objects if successful, or null if an error occurs.
 * @throws {Error} - Throws an error if the API request fails and cannot be handled.
 */
const fetchUsers = async ({
  page = 1,
  limit = 10,
  sortBy = 'u.created_at',
  sortOrder = 'ASC',
}: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}): Promise<UseUsersResponse> => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.ALL_USERS, {
      params: { page, limit, sortBy, sortOrder }, // Send query parameters
    });

    const { data, pagination } = response.data;
    return {
      data,
      pagination: {
        totalRecords: pagination.totalRecords,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages,
      },
    };
  } catch (error: any) {
    console.error('Error fetching users:', error.message);
    throw error; // Re-throw the error for thunk to handle
  }
};

/**
 * Fetches the authenticated user's profile.
 *
 * @returns {Promise<UserProfileResponse>} - The user's profile data.
 * @throws {AppError} - If the request fails or returns an unexpected response.
 */
const fetchUserProfile = async (): Promise<UserProfileResponse> => {
  try {
    const fetchProfile = () =>
      axiosInstance.get<UserProfileResponse>(API_ENDPOINTS.USER_PROFILE);

    // Add retry and timeout logic
    const response = await withTimeout(
      withRetry(
        fetchProfile,
        3,
        1000,
        'Failed to fetch user profile after retries'
      ), // Retry with delay
      5000, // Timeout in milliseconds
      'Fetching user profile timed out'
    );

    // Validate response structure
    if (!response.data || typeof response.data !== 'object') {
      throw new AppError('Unexpected response format', 400, {
        type: ErrorType.ValidationError,
        details: response.data,
      });
    }

    return response.data;
  } catch (err: unknown) {
    // Handle 401 Unauthorized
    if (isCustomAxiosError(err) && err.response?.status === 401) {
      clearTokens(); // Clear tokens for unauthorized errors
      throw new AppError('Unauthorized. Please log in again.', 401, {
        type: ErrorType.AuthenticationError,
      });
    }

    // Handle all other errors
    const mappedError = mapErrorMessage(err);
    handleError(mappedError);
    throw mappedError;
  }
};

/**
 * Exported user service object.
 */
export const userService = {
  fetchUsers,
  fetchUserProfile,
};
