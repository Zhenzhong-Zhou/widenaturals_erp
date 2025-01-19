import { createAsyncThunk } from '@reduxjs/toolkit';
import { csrfService } from '../../../services';
import { resetCsrfToken } from './csrfSlice'; // Import the reset action

export const getCsrfTokenThunk = createAsyncThunk<string, void, { rejectValue: string }>(
  'csrf/fetchCsrfToken',
  async (_, thunkAPI) => {
    try {
      console.info('Fetching CSRF token...');
      const csrfToken = await csrfService.fetchCsrfToken();
      console.info('CSRF token fetched:', csrfToken);
      
      if (!csrfToken) {
        throw new Error('CSRF token is empty or invalid');
      }
      
      return csrfToken;
    } catch (error) {
      // Dispatch reset action on error
      thunkAPI.dispatch(resetCsrfToken());
      
      console.error('Error fetching CSRF token:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Reject with a user-friendly error message
      return thunkAPI.rejectWithValue('Failed to fetch CSRF token. Please try again.');
    }
  }
);
