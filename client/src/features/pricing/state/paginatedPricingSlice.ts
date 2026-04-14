import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchPaginatedPricingThunk } from '@features/pricing';
import type {
  PricingListState,
  FlattenedPricingJoinRecord,
  PaginatedPricingListUiResponse,
} from '@features/pricing';

// ---------------------------
// Initial State
// ---------------------------
const initialState: PricingListState =
  createInitialPaginatedState<FlattenedPricingJoinRecord>();

// ---------------------------
// Slice
// ---------------------------
const paginatedPricingSlice = createSlice({
  name: 'paginatedPricing',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated pricing state back to its
     * initial, empty configuration.
     *
     * Typically used when:
     * - Leaving the pricing list page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedPricing: () => initialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedPricingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedPricingThunk.fulfilled,
        (state, action: PayloadAction<PaginatedPricingListUiResponse>) => {
          const payload = action.payload;
          
          state.loading = false;
          state.data = payload.data;
          
          state.pagination = {
            page: payload.pagination.page,
            limit: payload.pagination.limit,
            totalRecords: payload.pagination.totalRecords,
            totalPages: payload.pagination.totalPages,
          };
        }
      )
      
      // ---- rejected ----
      .addCase(fetchPaginatedPricingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch pricing records.';
      });
  },
});

export const { resetPaginatedPricing } = paginatedPricingSlice.actions;

export default paginatedPricingSlice.reducer;
