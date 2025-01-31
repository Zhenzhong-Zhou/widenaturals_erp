import { createSlice } from '@reduxjs/toolkit';
import { Pagination, PricingDetails } from './pricingTypes.ts';
import { getPricingDetails } from './pricingThunks';

interface PricingState {
  pricing: PricingDetails | null;
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: PricingState = {
  pricing: null,
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

const pricingSlice = createSlice({
  name: 'pricing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getPricingDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPricingDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.pricing = action.payload.data.pricing;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(getPricingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error fetching pricing details';
      });
  },
});

export default pricingSlice.reducer;
