import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createSkusThunk } from './skuThunks';
import type { CreateSkuResponse, CreateSkusState } from './skuTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// ---------------------------
// Initial State
// ---------------------------
const initialState: CreateSkusState = {
  data: null,
  loading: false,
  error: null,
};

// ---------------------------
// Slice
// ---------------------------
const createSkusSlice = createSlice({
  name: 'createSkus',
  initialState,
  reducers: {
    /**
     * Reset to a clean state.
     * Useful after dialog close or after a successful submission.
     */
    resetCreateSkus: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // -------------------------
      // Pending
      // -------------------------
      .addCase(createSkusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null; // clear previous result
      })

      // -------------------------
      // Fulfilled
      // -------------------------
      .addCase(
        createSkusThunk.fulfilled,
        (state, action: PayloadAction<CreateSkuResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )

      // -------------------------
      // Rejected
      // -------------------------
      .addCase(createSkusThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to create SKUs.');
      });
  },
});

// ---------------------------
// Exports
// ---------------------------
export const { resetCreateSkus } = createSkusSlice.actions;
export default createSkusSlice.reducer;
