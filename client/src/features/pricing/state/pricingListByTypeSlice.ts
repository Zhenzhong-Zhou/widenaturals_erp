import { createSlice } from '@reduxjs/toolkit';
import type { PricingState } from './pricingTypes';
import { fetchPricingDetailsByTypeThunk } from './pricingThunks';

const initialState: PricingState = {
  data: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

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
        state.loading = false;
        state.error = action.payload || 'Failed to fetch pricing details';
      });
  },
});

export default pricingListByTypeSlice.reducer;
