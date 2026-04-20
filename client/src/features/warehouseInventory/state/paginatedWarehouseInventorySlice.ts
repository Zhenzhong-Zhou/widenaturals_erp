import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchPaginatedWarehouseInventoryThunk } from '@features/warehouseInventory';
import type {
  WarehouseInventoryListState,
  FlattenedWarehouseInventory,
  PaginatedWarehouseInventoryListUiResponse,
} from '@features/warehouseInventory';

// ---------------------------
// Initial State
// ---------------------------
const initialState: WarehouseInventoryListState =
  createInitialPaginatedState<FlattenedWarehouseInventory>(25);

// ---------------------------
// Slice
// ---------------------------
const paginatedWarehouseInventorySlice = createSlice({
  name: 'paginatedWarehouseInventory',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated warehouse inventory state back to its
     * initial, empty configuration.
     *
     * Typically used when:
     * - Leaving the warehouse inventory list page
     * - Switching warehouses
     * - Performing a full filter reset
     */
    resetPaginatedWarehouseInventory: () => initialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedWarehouseInventoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedWarehouseInventoryThunk.fulfilled,
        (state, action: PayloadAction<PaginatedWarehouseInventoryListUiResponse>) => {
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
      .addCase(fetchPaginatedWarehouseInventoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch warehouse inventory records.';
      });
  },
});

export const { resetPaginatedWarehouseInventory } =
  paginatedWarehouseInventorySlice.actions;

export default paginatedWarehouseInventorySlice.reducer;
