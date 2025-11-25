import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type ProductLookupItem,
  type ProductLookupResponse,
  type ProductLookupState,
} from '@features/lookup/state/lookupTypes';

import { fetchProductLookupThunk } from './lookupThunks';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

// -----------------------------
// Initial State
// -----------------------------
const initialState: ProductLookupState =
  createInitialPaginatedLookupState<ProductLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const productLookupSlice = createSlice({
  name: 'productLookup',
  initialState,
  reducers: {
    /**
     * Reset Product lookup to clean initial pagination state.
     * Recreates the state from factory to avoid shared references.
     */
    resetProductLookup: (state) => {
      Object.assign(
        state,
        createInitialPaginatedLookupState<ProductLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchProductLookupThunk.fulfilled,
        (state, action: PayloadAction<ProductLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchProductLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? 'Failed to fetch product lookup';
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetProductLookup } = productLookupSlice.actions;
export default productLookupSlice.reducer;
