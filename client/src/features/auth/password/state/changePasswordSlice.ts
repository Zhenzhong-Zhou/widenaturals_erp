import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ChangePasswordResponse,
  ChangePasswordState,
} from '@features/auth';
import {
  changePasswordThunk,
} from '@features/auth';

// ----------------------------------------
// Initial State
// ----------------------------------------

const initialState: ChangePasswordState = {
  data: null,
  loading: false,
  error: null,
};


// ----------------------------------------
// Slice
// ----------------------------------------

const changePasswordSlice = createSlice({
  name: 'changePassword',
  initialState,
  reducers: {
    /**
     * Clears success + error state.
     * Useful when leaving the page or closing dialog.
     */
    resetChangePasswordState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      
      // -------------------------
      // Pending
      // -------------------------
      .addCase(changePasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // -------------------------
      // Fulfilled
      // -------------------------
      .addCase(
        changePasswordThunk.fulfilled,
        (state, action: PayloadAction<ChangePasswordResponse>) => {
          state.loading = false;
          state.error = null;
          state.data = action.payload.data; // { changedAt }
        }
      )
      
      // -------------------------
      // Rejected
      // -------------------------
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        
        if (action.payload) {
          state.error = action.payload.message;
        } else {
          state.error = 'Password change failed.';
        }
      });
  },
});


// ----------------------------------------
// Exports
// ----------------------------------------

export const { resetChangePasswordState } =
  changePasswordSlice.actions;

export default changePasswordSlice.reducer;
