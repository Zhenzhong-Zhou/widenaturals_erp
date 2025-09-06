import { createSlice } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type DeliveryMethodLookupItem,
  type DeliveryMethodLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchDeliveryMethodLookupThunk } from './lookupThunks';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

const initialState: DeliveryMethodLookupState =
  createInitialPaginatedLookupState<DeliveryMethodLookupItem>();

const deliveryMethodLookupSlice = createSlice({
  name: 'deliveryMethodLookup',
  initialState,
  reducers: {
    /**
     * Clears the current delivery method lookup state.
     */
    clearDeliveryMethodLookup: (state) => {
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

export const { clearDeliveryMethodLookup } = deliveryMethodLookupSlice.actions;
export default deliveryMethodLookupSlice.reducer;
