import { createSlice } from '@reduxjs/toolkit';
import { getCsrfTokenThunk } from './csrfThunk.ts'; // Ensure this points to the correct file

// Define the initial state with strict typing
const initialState = {
  token: null as string | null,
  status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
  error: null as string | null,
};

// Create the CSRF slice
const csrfSlice = createSlice({
  name: 'csrf',
  initialState,
  reducers: {
    /**
     * Resets the CSRF token state to its initial values.
     */
    resetCsrfToken: (state) => {
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle pending state when the CSRF token is being fetched
      .addCase(getCsrfTokenThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear any previous errors
      })
      // Handle fulfilled state when the CSRF token is successfully fetched
      .addCase(getCsrfTokenThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload;
      })
      // Handle rejected state when fetching the CSRF token fails
      .addCase(getCsrfTokenThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'An unknown error occurred';
      });
  },
});

export const { resetCsrfToken } = csrfSlice.actions;

export default csrfSlice.reducer;
