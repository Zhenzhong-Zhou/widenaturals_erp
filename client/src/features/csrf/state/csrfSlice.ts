import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getCsrfTokenThunk } from './csrfThunk';

// Define a type for the state
interface CSRFState {
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Strictly type the initial state
const initialState: CSRFState = {
  token: null,
  status: 'idle',
  error: null,
};

// Create the CSRF slice
const csrfSlice = createSlice({
  name: 'csrf',
  initialState,
  reducers: {
    /**
     * Resets the CSRF token state to its initial values.
     */
    resetCsrfToken: () => initialState, // Resets state to the initial state
    
    /**
     * Manually updates the CSRF token in the Redux state.
     */
    updateCsrfToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload; // Update the token
      state.status = 'succeeded'; // Mark status as succeeded
      state.error = null; // Clear any previous errors
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
      .addCase(
        getCsrfTokenThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.status = 'succeeded';
          state.token = action.payload;
        }
      )
      // Handle rejected state when fetching the CSRF token fails
      .addCase(getCsrfTokenThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'An unknown error occurred';
      });
  },
});

export const { resetCsrfToken, updateCsrfToken } = csrfSlice.actions;

export default csrfSlice.reducer;
