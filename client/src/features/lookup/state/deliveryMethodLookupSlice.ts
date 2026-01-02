import { createSlice } from '@reduxjs/toolkit';
import type {
  DeliveryMethodLookupItem,
  DeliveryMethodLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchDeliveryMethodLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

const initialState: DeliveryMethodLookupState =
  createInitialOffsetPaginatedState<DeliveryMethodLookupItem>();

const deliveryMethodLookupSlice = createSlice({
  name: 'deliveryMethodLookup',
  initialState,
  reducers: {
    /**
     * Clears the current delivery method lookup state.
     */
    resetDeliveryMethodLookup: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveryMethodLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveryMethodLookupThunk.fulfilled, (state, action) => {
        applyPaginatedFulfilled(state, action.payload);
      })
      .addCase(fetchDeliveryMethodLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as Error | { message?: string })?.message ||
          'Failed to fetch delivery method lookup';
      });
  },
});

export const { resetDeliveryMethodLookup } = deliveryMethodLookupSlice.actions;
export default deliveryMethodLookupSlice.reducer;
