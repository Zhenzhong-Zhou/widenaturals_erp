import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import {
  fetchPaginatedBatchRegistryThunk,
} from '@features/batchRegistry';
import type {
  PaginatedBatchRegistryState,
  BatchRegistryRecord,
  PaginatedBatchRegistryListResponse,
} from '@features/batchRegistry';

// ---------------------------
// Initial State
// ---------------------------
const initialState: PaginatedBatchRegistryState =
  createInitialPaginatedState<BatchRegistryRecord>();

// ---------------------------
// Slice
// ---------------------------
const paginatedBatchRegistrySlice = createSlice({
  name: 'paginatedBatchRegistry',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated batch registry state back to its
     * initial, empty configuration.
     *
     * Typically used when:
     * - Leaving the batch registry page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedBatchRegistry: () => initialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedBatchRegistryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedBatchRegistryThunk.fulfilled,
        (
          state,
          action: PayloadAction<PaginatedBatchRegistryListResponse>
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
      .addCase(fetchPaginatedBatchRegistryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch batch registry records.';
      });
  },
});

export const {
  resetPaginatedBatchRegistry,
} = paginatedBatchRegistrySlice.actions;

export default paginatedBatchRegistrySlice.reducer;
