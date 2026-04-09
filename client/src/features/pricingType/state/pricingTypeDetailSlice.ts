import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  PricingTypeDetailApiResponse,
  PricingTypeDetailState,
} from '@features/pricingType';
import { fetchPricingTypeByIdThunk } from '@features/pricingType';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

/**
 * Initial state for the pricing type detail slice.
 */
const initialState: PricingTypeDetailState = {
  data: null,
  loading: false,
  error: null,
};

export const pricingTypeDetailSlice = createSlice({
  name: 'pricingTypeDetail',
  initialState,
  reducers: {
    /**
     * Reset the pricing type detail state back to its initial configuration.
     * Typically used when navigating away from the pricing type detail page.
     */
    resetPricingTypeDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // --- Pending ---
      .addCase(fetchPricingTypeByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // --- Fulfilled ---
      .addCase(
        fetchPricingTypeByIdThunk.fulfilled,
        (state, action: PayloadAction<PricingTypeDetailApiResponse>) => {
          state.loading = false;
          state.data = action.payload.data; // unwrap API envelope
        }
      )
      
      // --- Rejected ---
      .addCase(fetchPricingTypeByIdThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to load pricing type details.');
      });
  },
});

export const { resetPricingTypeDetail } = pricingTypeDetailSlice.actions;

export default pricingTypeDetailSlice.reducer;
