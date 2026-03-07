import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchPricingListDataThunk } from './pricingThunks';
import type {
  PaginatedPricingRecordsResponse,
  PricingListState,
  PricingRecord,
} from './pricingTypes';
import { createInitialPaginatedState } from '@store/pagination';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

/**
 * Initial state and structure for managing paginated pricing records in the pricing list view.
 */
const initialState: PricingListState =
  createInitialPaginatedState<PricingRecord>();

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
        applyRejected(state, action, 'Failed to fetch pricing records.');
      });
  },
});

export default pricingListSlice.reducer;
