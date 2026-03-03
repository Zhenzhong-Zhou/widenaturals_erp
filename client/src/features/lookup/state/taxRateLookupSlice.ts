import { createSlice } from '@reduxjs/toolkit';
import type {
  TaxRateLookupItem,
  TaxRateLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchTaxRateLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: TaxRateLookupState =
  createInitialOffsetPaginatedState<TaxRateLookupItem>();

const taxRateLookupSlice = createSlice({
  name: 'taxRateLookup',
  initialState,
  reducers: {
    /**
     * Clears the current tax rate lookup state.
     */
    resetTaxRateLookup: (state) => {
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
        applyRejected(
          state,
          action,
          'Failed to fetch tax rate lookup'
        );
      });
  },
});

export const { resetTaxRateLookup } = taxRateLookupSlice.actions;
export default taxRateLookupSlice.reducer;
