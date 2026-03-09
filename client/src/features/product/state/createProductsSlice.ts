import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createProductsThunk } from './productThunks';
import type {
  CreateProductResponse,
  CreateProductsState,
} from './productTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// ---------------------------
// Initial State
// ---------------------------
const initialState: CreateProductsState = {
  data: null,
  loading: false,
  error: null,
};

// ---------------------------
// Slice
// ---------------------------
const createProductsSlice = createSlice({
  name: 'createProducts',
  initialState,
  reducers: {
    /**
     * Reset to a clean state.
     * Useful after dialog close or after a successful submission.
     */
    resetCreateProducts: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // -------------------------
      // Pending
      // -------------------------
      .addCase(createProductsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null; // clear previous result
      })

      // -------------------------
      // Fulfilled
      // -------------------------
      .addCase(
        createProductsThunk.fulfilled,
        (state, action: PayloadAction<CreateProductResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )

      // -------------------------
      // Rejected
      // -------------------------
      .addCase(createProductsThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to create products.');
      });
  },
});

// ---------------------------
// Exports
// ---------------------------
export const { resetCreateProducts } = createProductsSlice.actions;
export default createProductsSlice.reducer;
