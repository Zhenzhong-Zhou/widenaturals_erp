import { createSlice } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type TaxRateLookupItem,
  type TaxRateLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchTaxRateLookupThunk } from './lookupThunks';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

const initialState: TaxRateLookupState =
  createInitialPaginatedLookupState<TaxRateLookupItem>();

const taxRateLookupSlice = createSlice({
  name: 'taxRateLookup',
  initialState,
  reducers: {
    /**
     * Clears the current tax rate lookup state.
     */
    clearTaxRateLookup: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxRateLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaxRateLookupThunk.fulfilled, (state, action) => {
        applyPaginatedFulfilled(state, action.payload);
      })
      .addCase(fetchTaxRateLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as Error | { message?: string })?.message ||
          'Failed to fetch tax rate lookup';
      });
  },
});

export const { clearTaxRateLookup } = taxRateLookupSlice.actions;
export default taxRateLookupSlice.reducer;
