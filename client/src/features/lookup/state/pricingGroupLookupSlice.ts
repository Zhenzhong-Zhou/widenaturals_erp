import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  PricingGroupLookupItem,
  PricingGroupLookupResponse,
  PricingGroupLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchPricingGroupLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

/**
 * Initial state for the pricing lookup slice.
 */
const initialState: PricingGroupLookupState =
  createInitialOffsetPaginatedState<PricingGroupLookupItem>();

/**
 * Redux slice to manage pricing group lookup state for dropdowns and autocomplete fields.
 *
 * Handles async lifecycle of pricing fetch operations and tracks paginated results,
 * error/loading states, and optional enrichment (e.g., status flags).
 */
const pricingGroupLookupSlice = createSlice({
  name: 'pricingGroupLookup',
  initialState,
  reducers: {
    /**
     * Resets the pricing group lookup state to its initial default values.
     */
    resetPricingGroupLookup: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingGroupLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingGroupLookupThunk.fulfilled,
        (state, action: PayloadAction<PricingGroupLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchPricingGroupLookupThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch pricing group lookup');
      });
  },
});

export const { resetPricingGroupLookup } = pricingGroupLookupSlice.actions;
export default pricingGroupLookupSlice.reducer;
