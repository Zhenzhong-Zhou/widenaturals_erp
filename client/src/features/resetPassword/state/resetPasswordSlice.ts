import { createSlice } from '@reduxjs/toolkit';
import { resetPasswordThunk } from './resetPasswordThunk';
// import { ResetPasswordError } from './resetPasswordInterfaces.ts';

interface ResetPasswordState {
  loading: boolean;
  success: boolean;
  message: string | null;
  error: string | null;
  details: Array<{ message: string; path?: string }> | null;
}

const initialState: ResetPasswordState = {
  loading: false,
  success: false,
  message: null,
  error: null,
  details: null,
};

const resetPasswordSlice = createSlice({
  name: 'resetPassword',
  initialState,
  reducers: {
    clearResetPasswordState(state) {
      state.loading = false;
      state.success = false;
      state.message = null;
      state.error = null;
      state.details = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(resetPasswordThunk.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.message = null;
        state.error = null;
        state.details = null;
      })
      .addCase(resetPasswordThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.success = true;
        state.message = payload.message;
        state.error = null;
        state.details = null;
      })
      .addCase(resetPasswordThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.success = false;
        // state.message = payload?.message || 'Validation failed.';
        state.error = payload?.message || 'Validation failed.';
        state.details = null;
      });
  },
});

export const { clearResetPasswordState } = resetPasswordSlice.actions;

export default resetPasswordSlice.reducer;
