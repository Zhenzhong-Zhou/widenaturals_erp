import { createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../../services/userService.ts';
import { AppError } from '@utils/AppError.tsx';
import { UserProfile } from './userTypes.ts';

// Define the Thunk
export const fetchUserProfileThunk = createAsyncThunk<UserProfile, void, { rejectValue: string }>(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.fetchUserProfile(); // The payload of the fulfilled action
    } catch (err) {
      if (err instanceof AppError) {
        return rejectWithValue(err.message); // Return a string from rejectWithValue
      }
      return rejectWithValue('An unexpected error occurred'); // Return a string from rejectWithValue
    }
  }
);
