import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  PricingTypeLookupItem,
  PricingTypeLookupResponse,
  PricingTypeLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchPricingTypeLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// -----------------------------
// Initial State
// -----------------------------
const initialState: PricingTypeLookupState =
  createInitialOffsetPaginatedState<PricingTypeLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const pricingTypeLookupSlice = createSlice({
  name: 'pricingTypeLookup',
  initialState,
  reducers: {
    /**
     * Reset Pricing Type lookup to clean initial pagination state.
     */
    resetPricingTypeLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<PricingTypeLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingTypeLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingTypeLookupThunk.fulfilled,
        (state, action: PayloadAction<PricingTypeLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchPricingTypeLookupThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch pricing type lookup');
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetPricingTypeLookup } = pricingTypeLookupSlice.actions;

export default pricingTypeLookupSlice.reducer;
