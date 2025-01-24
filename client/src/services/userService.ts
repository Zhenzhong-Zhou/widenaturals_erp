import axiosInstance from '@utils/axiosConfig.ts';
import { clearTokens } from '@utils/tokenManager.ts';
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts';
import { AppError, ErrorType } from '@utils/AppError.tsx';
import { User, UserProfileResponse } from '../features/user/state/userTypes.ts';
import { isCustomAxiosError } from '@utils/axiosUtils.ts';
import { withTimeout } from '@utils/timeoutUtils.ts';
import { withRetry } from '@utils/retryUtils.ts';

const API_ENDPOINTS = {
  ALL_USERS: '/users',
  USER_PROFILE: '/users/me',
};

/**
 * Fetches a list of all users from the API.
 *
 * @async
 * @function fetchUsers
 * @returns {Promise<User[] | null>} - A promise that resolves to an array of user objects if successful, or null if an error occurs.
 * @throws {Error} - Throws an error if the API request fails and cannot be handled.
 */
const fetchUsers = async (): Promise<User[] | null> => {
  try {
    const response = await axiosInstance.get<User[]>(API_ENDPOINTS.ALL_USERS);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching users:', error.message);
    
    // Optionally rethrow the error or handle it based on the application logic
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error('Server Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No Response:', error.request);
    } else {
      // Something happened while setting up the request
      console.error('Request Error:', error.message);
    }
    
    // Return null or throw error based on your requirements
    return null;
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
      withRetry(fetchProfile, 3, 1000, 'Failed to fetch user profile after retries'), // Retry with delay
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
