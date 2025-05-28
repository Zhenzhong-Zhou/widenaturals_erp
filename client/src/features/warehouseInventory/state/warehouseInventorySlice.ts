import { createSlice } from '@reduxjs/toolkit';
import { fetchWarehouseInventoryRecordsThunk } from './warehouseInventoryThunks';
import type { WarehouseInventoryState, } from './warehouseInventoryTypes';

const initialState: WarehouseInventoryState = {
  data: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  },
};

const warehouseInventorySlice = createSlice({
  name: 'warehouseInventory',
  initialState,
  reducers: {
    resetWarehouseInventoryState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseInventoryRecordsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouseInventoryRecordsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchWarehouseInventoryRecordsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetWarehouseInventoryState } = warehouseInventorySlice.actions;
export default warehouseInventorySlice.reducer;
