import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RefreshSessionState,
  RefreshTokenResponseData,
} from '@features/session';
import { refreshTokenThunk } from '@features/session';

// ---------------------------
// Initial State
// ---------------------------
const initialState: RefreshSessionState = {
  data: null,
  loading: false,
  error: null,
};

// ---------------------------
// Slice
// ---------------------------
const refreshSessionSlice = createSlice({
  name: 'refreshSession',
  initialState,
  
  reducers: {
    /**
     * Reset refresh session state.
     *
     * This clears loading/error flags and should be
     * used after successful hydration or navigation.
     */
    resetRefreshSession: () => initialState,
  },
  
  extraReducers: (builder) => {
    builder
      // -------------------------
      // Pending
      // -------------------------
      .addCase(refreshTokenThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      
      // -------------------------
      // Fulfilled
      // -------------------------
      .addCase(
        refreshTokenThunk.fulfilled,
        (
          state,
          action: PayloadAction<RefreshTokenResponseData>
        ) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )
      
      // -------------------------
      // Rejected
      // -------------------------
      .addCase(refreshTokenThunk.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          'Session refresh failed.';
      });
  },
});

// ---------------------------
// Exports
// ---------------------------
export const { resetRefreshSession } =
  refreshSessionSlice.actions;
export default refreshSessionSlice.reducer;
