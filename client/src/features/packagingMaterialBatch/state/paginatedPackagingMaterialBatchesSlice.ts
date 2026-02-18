import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchPaginatedPackagingMaterialBatchThunk } from '@features/packagingMaterialBatch';
import type {
  PaginatedPackagingMaterialBatchState,
  FlattenedPackagingMaterialBatchRow,
  PackagingMaterialBatchListUiResponse,
} from '@features/packagingMaterialBatch';

// ---------------------------
// Initial State
// ---------------------------
const initialState: PaginatedPackagingMaterialBatchState =
  createInitialPaginatedState<FlattenedPackagingMaterialBatchRow>();

// ---------------------------
// Slice
// ---------------------------
const paginatedPackagingMaterialBatchesSlice = createSlice({
  name: 'paginatedPackagingMaterialBatches',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated packaging material batch state
     * back to its initial, empty configuration.
     *
     * Typically used when:
     * - Leaving the packaging material batch page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedPackagingMaterialBatches: () => initialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedPackagingMaterialBatchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedPackagingMaterialBatchThunk.fulfilled,
        (
          state,
          action: PayloadAction<PackagingMaterialBatchListUiResponse>
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
      .addCase(
        fetchPaginatedPackagingMaterialBatchThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            (action.payload as any)?.message ??
            action.error?.message ??
            'Failed to fetch packaging material batch records.';
        }
      );
  },
});

export const { resetPaginatedPackagingMaterialBatches } =
  paginatedPackagingMaterialBatchesSlice.actions;

export default paginatedPackagingMaterialBatchesSlice.reducer;
