import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pricing, PricingResponse, Pagination } from './pricingTypes.ts';
import { fetchPricingData } from './pricingThunks';

interface PricingState {
  data: Pricing[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: PricingState = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,
};

const pricingSlice = createSlice({
  name: 'pricing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingData.fulfilled,
        (state, action: PayloadAction<PricingResponse>) => {
          state.loading = false;
          state.data = action.payload.data.data;
          state.pagination = action.payload.data.pagination;
        }
      )
      .addCase(fetchPricingData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'An error occurred';
      });
  },
});

export default pricingSlice.reducer;
