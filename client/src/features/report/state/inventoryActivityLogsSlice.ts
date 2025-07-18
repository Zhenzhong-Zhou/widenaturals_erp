import { createSlice } from '@reduxjs/toolkit';
import {
  fetchBaseInventoryActivityLogsThunk,
  fetchPaginatedInventoryActivityLogsThunk,
} from '@features/report/state';
import type { InventoryActivityLogsState } from '@features/report/state';

const initialState: InventoryActivityLogsState = {
  base: {
    data: [],
    loading: false,
    error: null,
  },
  paginated: {
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      totalRecords: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
  },
};

export const inventoryActivityLogsSlice = createSlice({
  name: 'inventoryActivityLogs',
  initialState,
  reducers: {
    /**
     * Resets both base and paginated inventory log state to initial values.
     */
    resetActivityLogsState: () => initialState,
  },
  extraReducers: (builder) => {
    // Base (non-paginated) logs
    builder
      .addCase(fetchBaseInventoryActivityLogsThunk.pending, (state) => {
        state.base.loading = true;
        state.base.error = null;
      })
      .addCase(
        fetchBaseInventoryActivityLogsThunk.fulfilled,
        (state, action) => {
          state.base.loading = false;
          state.base.data = action.payload.data;
        }
      )
      .addCase(
        fetchBaseInventoryActivityLogsThunk.rejected,
        (state, action) => {
          state.base.loading = false;
          state.base.error =
            action.error.message ?? 'Failed to fetch base inventory logs.';
        }
      );

    // Paginated logs
    builder
      .addCase(fetchPaginatedInventoryActivityLogsThunk.pending, (state) => {
        state.paginated.loading = true;
        state.paginated.error = null;
      })
      .addCase(
        fetchPaginatedInventoryActivityLogsThunk.fulfilled,
        (state, action) => {
          state.paginated.loading = false;
          state.paginated.data = action.payload.data;
          state.paginated.pagination = action.payload.pagination;
        }
      )
      .addCase(
        fetchPaginatedInventoryActivityLogsThunk.rejected,
        (state, action) => {
          state.paginated.loading = false;
          state.paginated.error =
            action.error.message ?? 'Failed to fetch paginated inventory logs.';
        }
      );
  },
});

export const { resetActivityLogsState } = inventoryActivityLogsSlice.actions;
export default inventoryActivityLogsSlice.reducer;
