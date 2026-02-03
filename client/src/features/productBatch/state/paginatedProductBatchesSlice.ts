import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import {
  fetchPaginatedProductBatchThunk,
} from '@features/productBatch';
import type {
  PaginatedProductBatchState,
  FlattenedProductBatchRecord,
  PaginatedProductBatchListResponse,
} from '@features/productBatch';

// ---------------------------
// Initial State
// ---------------------------
const initialState: PaginatedProductBatchState =
  createInitialPaginatedState<FlattenedProductBatchRecord>();

// ---------------------------
// Slice
// ---------------------------
const paginatedProductBatchesSlice = createSlice({
  name: 'paginatedProductBatches',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated product batch state back to its
     * initial, empty configuration.
     *
     * Typically used when:
     * - Leaving the product batch page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedProductBatches: () => initialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedProductBatchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedProductBatchThunk.fulfilled,
        (
          state,
          action: PayloadAction<PaginatedProductBatchListResponse>
        ) => {
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
      .addCase(fetchPaginatedProductBatchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch product batch records.';
      });
  },
});

export const {
  resetPaginatedProductBatches,
} = paginatedProductBatchesSlice.actions;

export default paginatedProductBatchesSlice.reducer;
