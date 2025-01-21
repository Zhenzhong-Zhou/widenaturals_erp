import { createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../../services/userService.ts';
import { AppError } from '@utils/AppError.tsx';
import { UserResponse } from './userTypes.ts';

// Define the Thunk
export const fetchUserProfileThunk = createAsyncThunk<UserResponse, void, { rejectValue: string }>(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
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
  }
);
