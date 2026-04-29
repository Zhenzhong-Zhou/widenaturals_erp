import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchPaginatedPricingGroupsThunk } from '@features/pricingGroup';
import type {
  PricingGroupState,
  PricingGroupRecord,
  PaginatedPricingGroupApiResponse,
} from '@features/pricingGroup';

// ---------------------------
// Initial State
// ---------------------------
const initialState: PricingGroupState =
  createInitialPaginatedState<PricingGroupRecord>();

// ---------------------------
// Slice
// ---------------------------
const paginatedPricingGroupsSlice = createSlice({
  name: 'paginatedPricingGroups',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated pricing group state back to its
     * initial, empty configuration.
     *
     * Typically used when:
     * - Leaving the pricing group page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedPricingGroups: () => initialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedPricingGroupsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedPricingGroupsThunk.fulfilled,
        (state, action: PayloadAction<PaginatedPricingGroupApiResponse>) => {
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
      .addCase(fetchPaginatedPricingGroupsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch pricing group records.';
      });
  },
});

export const { resetPaginatedPricingGroups } =
  paginatedPricingGroupsSlice.actions;

export default paginatedPricingGroupsSlice.reducer;
