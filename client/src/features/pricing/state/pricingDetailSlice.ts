import { createSlice } from '@reduxjs/toolkit';
import { getPricingDetailsThunk, Pagination, PricingDetails } from '@features/pricing';

export interface PricingState {
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
      .addCase(getPricingDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPricingDetailsThunk.fulfilled, (state, action) => {
        state.loading = false;
        
        const data = action.payload.data;
        const pricing = data?.pricing;
        const pagination = data?.pagination;
        
        if (!pricing) {
          state.pricing = null;
          state.pagination = pagination;
          return;
        }
        
        // Ensure correct structure for multiple products & locations
        state.pricing = {
          ...pricing,
          products: pricing.products ?? [], // Default to empty array if missing
          locations: pricing.locations ?? [], // Default to empty array if missing
        };

        state.pagination = pagination;
      })
      .addCase(getPricingDetailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error fetching pricing details';
      });
  },
});

export default pricingSlice.reducer;
