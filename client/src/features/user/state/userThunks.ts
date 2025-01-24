import { createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../../services';
import { AppError } from '@utils/AppError.tsx';
import { User, UserProfileResponse } from './userTypes.ts';

/**
 * Fetch all users from the API.
 *
 * @async
 * @function fetchUsersThunk
 * @returns {Promise<User[]>} - A promise resolving to an array of user objects.
 * @throws {string} - Throws an error message if the API call fails.
 */
export const fetchUsersThunk = createAsyncThunk<
  User[], // Return type on success
  void, // Argument type
  { rejectValue: string } // Type for rejectWithValue
>('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await userService.fetchUsers();
    return response as User[];
  } catch (error: any) {
    const errorMessage = error.response?.data || 'Failed to fetch users';
    console.error('Error fetching users:', errorMessage);
    return rejectWithValue(errorMessage);
  }
});

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
