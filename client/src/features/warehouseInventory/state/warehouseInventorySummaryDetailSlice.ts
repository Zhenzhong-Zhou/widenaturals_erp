import { createSlice } from '@reduxjs/toolkit';
import { fetchWarehouseInventorySummaryByItemIdThunk } from './warehouseInventoryThunks';
import type {
  WarehouseInventorySummaryDetailState
} from '@features/warehouseInventory/state/warehouseInventoryTypes';

const initialState: WarehouseInventorySummaryDetailState = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,
};

const warehouseInventorySummaryDetailSlice = createSlice({
  name: 'warehouseInventorySummaryDetail',
  initialState,
  reducers: {
    resetWarehouseInventorySummaryDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseInventorySummaryByItemIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouseInventorySummaryByItemIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchWarehouseInventorySummaryByItemIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch warehouse inventory summary.';
      });
  },
});

export const { resetWarehouseInventorySummaryDetail } =
  warehouseInventorySummaryDetailSlice.actions;

export default warehouseInventorySummaryDetailSlice.reducer;
