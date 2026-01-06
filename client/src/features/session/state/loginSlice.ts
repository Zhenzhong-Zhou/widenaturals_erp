import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LoginResponseData, LoginState } from '@features/session';
import { loginThunk } from './sessionThunks';

// ---------------------------
// Initial State
// ---------------------------
const initialState: LoginState = {
  data: null,
  loading: false,
  error: null,
};

// ---------------------------
// Slice
// ---------------------------
const loginSlice = createSlice({
  name: 'login',
  initialState,
  
  reducers: {
    /**
     * Clears session state.
     * Should be used on logout or hard session reset.
     */
    resetLogin: () => initialState,
  },
  
  extraReducers: (builder) => {
    builder
      // -------------------------
      // Login: Pending
      // -------------------------
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      
      // -------------------------
      // Login: Fulfilled
      // -------------------------
      .addCase( loginThunk.fulfilled, (state, action: PayloadAction<LoginResponseData>) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      
      // -------------------------
      // Login: Rejected
      // -------------------------
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        state.error =
          action.payload || action.error?.message || 'Login failed.';
      });
  },
});

// ---------------------------
// Exports
// ---------------------------
export const { resetLogin } = loginSlice.actions;
export default loginSlice.reducer;
