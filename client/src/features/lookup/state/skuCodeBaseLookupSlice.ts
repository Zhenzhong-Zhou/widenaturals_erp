import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type SkuCodeBaseLookupItem,
  type SkuCodeBaseLookupResponse,
  type SkuCodeBaseLookupState,
} from '@features/lookup/state/lookupTypes';

import { fetchSkuCodeBaseLookupThunk } from './lookupThunks';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

// -----------------------------
// Initial State
// -----------------------------
const initialState: SkuCodeBaseLookupState =
  createInitialPaginatedLookupState<SkuCodeBaseLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const skuCodeBaseLookupSlice = createSlice({
  name: 'skuCodeBaseLookup',
  initialState,
  reducers: {
    /**
     * Reset SKU Code Base lookup to clean initial pagination state.
     * Uses factory to avoid shared reference issues.
     */
    resetSkuCodeBaseLookup: (state) => {
      Object.assign(
        state,
        createInitialPaginatedLookupState<SkuCodeBaseLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkuCodeBaseLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSkuCodeBaseLookupThunk.fulfilled,
        (state, action: PayloadAction<SkuCodeBaseLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchSkuCodeBaseLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          'Failed to fetch SKU Code Base lookup';
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetSkuCodeBaseLookup } = skuCodeBaseLookupSlice.actions;
export default skuCodeBaseLookupSlice.reducer;
