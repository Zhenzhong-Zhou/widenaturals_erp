import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppError } from '@utils/AppError';
import { PaginationInfo, User, UserProfileResponse } from '@features/user';
import { userService } from '@services/userService';

/**
 * Fetch all users from the API.
 *
 * @async
 * @function fetchUsersThunk
 * @returns {Promise<User[]>} - A promise resolving to an array of user objects.
 * @throws {string} - Throws an error message if the API call fails.
 */
export const fetchUsersThunk = createAsyncThunk<
  { data: User[]; pagination: PaginationInfo }, // Return type on success
  { page?: number; limit?: number; sortBy?: string; sortOrder?: string }, // Argument type
  { rejectValue: string } // Type for rejectWithValue
>(
  'users/fetchAll',
  async (
    { page = 1, limit = 10, sortBy = 'u.created_at', sortOrder = 'ASC' },
    { rejectWithValue }
  ) => {
    try {
      const response = await userService.fetchUsers({
        page,
        limit,
        sortBy,
        sortOrder,
      });

      if (!response) {
        // Handle the case where response is null
        return rejectWithValue('Failed to fetch users');
      }

      return {
        data: response.data, // Access response.data correctly
        pagination: response.pagination, // Access response.pagination correctly
      };
    } catch (error: any) {
      const errorMessage = error.response?.data || 'Failed to fetch users';
      console.error('Error fetching users:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Define the Thunk
export const fetchUserProfileThunk = createAsyncThunk<
  UserProfileResponse,
  void,
  { rejectValue: string }
>('user/fetchUserProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await userService.fetchUserProfile(); // Fetch the full response
    if (!response || !response.data) {
      throw new AppError('Unexpected response structure', 400);
    }
    return response; // Return the full UserResponse
  } catch (err) {
    if (err instanceof AppError) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue('An unexpected error occurred');
  }
});
