import { createSlice } from '@reduxjs/toolkit';
import type { PricingDetail, PricingState } from './pricingTypes';
import { fetchPricingDetailsByTypeThunk } from './pricingThunks';
import { createInitialPaginatedState } from '@store/pagination';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: PricingState =
  createInitialPaginatedState<PricingDetail>();

const pricingListByTypeSlice = createSlice({
  name: 'pricingListByType',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingDetailsByTypeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPricingDetailsByTypeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data ?? [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPricingDetailsByTypeThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to fetch pricing details.'
        );
      });
  },
});

export default pricingListByTypeSlice.reducer;
