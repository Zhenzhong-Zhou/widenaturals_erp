/**
 * @file paginatedWarehouseSlice.ts
 *
 * Redux slice for the paginated warehouse list.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchPaginatedWarehousesThunk } from './warehouseThunks';
import type {
  PaginatedWarehouseListState,
  WarehouseRecord,
  PaginatedWarehouseListApiResponse,
} from './warehouseTypes';

const initialState: PaginatedWarehouseListState =
  createInitialPaginatedState<WarehouseRecord>();

const paginatedWarehouseSlice = createSlice({
  name: 'paginatedWarehouses',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated warehouse state back to its
     * initial, empty configuration.
     *
     * Typically used when:
     * - Leaving the warehouse list page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedWarehouses: () => initialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedWarehousesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedWarehousesThunk.fulfilled,
        (state, action: PayloadAction<PaginatedWarehouseListApiResponse>) => {
          const payload = action.payload;
          
          state.loading = false;
          state.data = payload.data;
          
          state.pagination = {
            page:         payload.pagination.page,
            limit:        payload.pagination.limit,
            totalRecords: payload.pagination.totalRecords,
            totalPages:   payload.pagination.totalPages,
          };
        }
      )
      
      // ---- rejected ----
      .addCase(fetchPaginatedWarehousesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch warehouse records.';
      });
  },
});

export const { resetPaginatedWarehouses } = paginatedWarehouseSlice.actions;

export default paginatedWarehouseSlice.reducer;
