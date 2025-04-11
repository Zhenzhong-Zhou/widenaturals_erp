import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  fetchPricingDataThunk,
  type Pagination,
  type Pricing,
  type PricingResponse,
} from '@features/pricing';

export interface PricingListState {
  data: Pricing[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: PricingListState = {
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
      .addCase(fetchPricingDataThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingDataThunk.fulfilled,
        (state, action: PayloadAction<PricingResponse>) => {
          state.loading = false;
          state.data = action.payload.data.data;
          state.pagination = action.payload.data.pagination;
        }
      )
      .addCase(fetchPricingDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'An error occurred';
      });
  },
});

export default pricingSlice.reducer;
