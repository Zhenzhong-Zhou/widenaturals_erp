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
        
        // Ensure product, location, and location_type data are structured correctly
        state.pricing = {
          ...action.payload.data.pricing,
          product: action.payload.data.pricing.product ?? {
            product_id: '',
            name: 'Unknown',
            brand: 'Unknown',
            barcode: '',
            category: 'Unknown',
            market_region: 'Unknown',
          },
          location: action.payload.data.pricing.location ?? {
            location_id: '',
            location_name: 'Unknown',
            location_type: {
              type_id: '',
              type_code: '',
              type_name: 'Unknown',
            },
          },
        };
        
        state.pagination = action.payload.data.pagination;
      })
      .addCase(getPricingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error fetching pricing details';
      });
  },
});

export default pricingSlice.reducer;
