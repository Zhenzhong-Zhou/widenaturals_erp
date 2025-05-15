import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchPricingListDataThunk } from './pricingThunks';
import type { PaginatedPricingRecordsResponse, PricingListState } from './pricingTypes';

/**
 * Initial state and structure for managing paginated pricing records in the pricing list view.
 */
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

const pricingListSlice = createSlice({
  name: 'pricingList',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingListDataThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingListDataThunk.fulfilled,
        (state, action: PayloadAction<PaginatedPricingRecordsResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchPricingListDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch pricing records.';
      });
  },
});

export default pricingListSlice.reducer;
