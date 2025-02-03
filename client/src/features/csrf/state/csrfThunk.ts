import { createAsyncThunk } from '@reduxjs/toolkit';
import { csrfService } from '../../../services';

export const getCsrfTokenThunk = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>('csrf/fetchCsrfToken', async (_, thunkAPI) => {
  try {
    const csrfToken = await csrfService.fetchCsrfToken();
    
    if (!csrfToken) {
      throw new Error('CSRF token is empty or invalid');
    }
    
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    
    // Reject with a user-friendly error message
    return thunkAPI.rejectWithValue(
      'Failed to fetch CSRF token. The server might be down.'
    );
  }
});
