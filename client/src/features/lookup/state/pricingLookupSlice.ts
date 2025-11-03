import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type PricingLookupItem,
  type PricingLookupResponse,
  type PricingLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchPricingLookupThunk } from './lookupThunks';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

/**
 * Initial state for the pricing lookup slice.
 */
const initialState: PricingLookupState =
  createInitialPaginatedLookupState<PricingLookupItem>();

/**
 * Redux slice to manage pricing lookup state for dropdowns and autocomplete fields.
 *
 * Handles async lifecycle of pricing fetch operations and tracks paginated results,
 * error/loading states, and optional enrichment (e.g., status flags).
 */
const pricingLookupSlice = createSlice({
  name: 'pricingLookup',
  initialState,
  reducers: {
    /**
     * Resets the pricing lookup state to its initial default values.
     */
    resetPricingLookup: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingLookupThunk.fulfilled,
        (state, action: PayloadAction<PricingLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchPricingLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? 'Failed to fetch pricing lookup';
      });
  },
});

export const { resetPricingLookup } = pricingLookupSlice.actions;
export default pricingLookupSlice.reducer;
