import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchPaginatedPricingTypesThunk } from '@features/pricingType';
import type {
  PricingTypeState,
  PricingTypeRecord,
  PaginatedPricingTypeApiResponse,
} from '@features/pricingType';

// ---------------------------
// Initial State
// ---------------------------
const initialState: PricingTypeState =
  createInitialPaginatedState<PricingTypeRecord>();

// ---------------------------
// Slice
// ---------------------------
const paginatedPricingTypesSlice = createSlice({
  name: 'paginatedPricingTypes',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated pricing type state back to its
     * initial, empty configuration.
     *
     * Typically used when:
     * - Leaving the pricing type page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedPricingTypes: () => initialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedPricingTypesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedPricingTypesThunk.fulfilled,
        (state, action: PayloadAction<PaginatedPricingTypeApiResponse>) => {
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
      .addCase(fetchPaginatedPricingTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch pricing type records.';
      });
  },
});

export const { resetPaginatedPricingTypes } =
  paginatedPricingTypesSlice.actions;

export default paginatedPricingTypesSlice.reducer;
