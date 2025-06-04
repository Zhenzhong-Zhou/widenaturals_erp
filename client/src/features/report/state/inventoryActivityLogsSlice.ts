import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  exportInventoryActivityLogsThunk,
  fetchInventoryActivityLogsThunk,
  type InventoryActivityLogsResponse,
  type InventoryActivityLogsState,
} from '@features/report';

/**
 * Initial state for Inventory Activity Logs
 * - Uses `ReportBaseState<InventoryActivityLog>`
 * - Ensures consistency with other reports
 */
const initialState: InventoryActivityLogsState = {
  data: [], // Now an array (not null) to prevent type errors
  exportData: null,
  exportFormat: null,
  loading: false,
  exportLoading: false,
  error: null,
  exportError: null,
  pagination: { page: 1, limit: 50, totalRecords: 0, totalPages: 1 },
};

const inventoryLogsSlice = createSlice({
  name: 'inventoryActivityLogs',
  initialState,
  reducers: {
    /**
     * Reset function to clear all states
     * - Ensures structure consistency
     */
    resetInventoryLogs: (state) => {
      state.data = [];
      state.exportData = null;
      state.exportFormat = null;
      state.loading = false;
      state.exportLoading = false;
      state.error = null;
      state.exportError = null;
      state.pagination = { page: 1, limit: 50, totalRecords: 0, totalPages: 1 };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Inventory Logs
      .addCase(fetchInventoryActivityLogsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInventoryActivityLogsThunk.fulfilled,
        (state, action: PayloadAction<InventoryActivityLogsResponse>) => {
          state.loading = false;
          state.data = action.payload.data; // Ensure it assigns correctly
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchInventoryActivityLogsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Export Inventory Logs
      .addCase(exportInventoryActivityLogsThunk.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(
        exportInventoryActivityLogsThunk.fulfilled,
        (state, action: PayloadAction<Blob>) => {
          state.exportLoading = false;
          state.exportData = action.payload;
        }
      )
      .addCase(exportInventoryActivityLogsThunk.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload as string;
      });
  },
});

export const { resetInventoryLogs } = inventoryLogsSlice.actions;
export default inventoryLogsSlice.reducer;
