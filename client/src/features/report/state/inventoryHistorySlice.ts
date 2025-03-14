import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryHistoryResponse, InventoryHistoryState } from './reportTypes';
import {
  exportInventoryHistoryThunk,
  fetchInventoryHistoryThunk,
} from './reportThunks.ts';

const initialState: InventoryHistoryState = {
  data: [], // Now an array (not null) to prevent type errors
  exportData: null,
  exportFormat: null,
  loading: false,
  exportLoading: false,
  error: null,
  exportError: null,
  pagination: { page: 1, limit: 50, totalRecords: 0, totalPages: 1 },
};

const inventoryHistorySlice = createSlice({
  name: 'inventoryHistory',
  initialState,
  reducers: {
    resetExportState: (state) => {
      state.exportData = null;
      state.exportError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Inventory History
    builder
      .addCase(fetchInventoryHistoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInventoryHistoryThunk.fulfilled,
        (state, action: PayloadAction<InventoryHistoryResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchInventoryHistoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch inventory history.';
      });

    // Export Inventory History
    builder
      .addCase(exportInventoryHistoryThunk.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(
        exportInventoryHistoryThunk.fulfilled,
        (state, action: PayloadAction<Blob>) => {
          state.exportLoading = false;
          state.exportData = action.payload;
        }
      )
      .addCase(exportInventoryHistoryThunk.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError =
          action.payload || 'Failed to export inventory history.';
      });
  },
});

export const { resetExportState } = inventoryHistorySlice.actions;
export default inventoryHistorySlice.reducer;
