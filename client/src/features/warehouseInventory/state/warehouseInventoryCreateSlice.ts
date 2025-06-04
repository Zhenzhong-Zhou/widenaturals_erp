import { createSlice } from '@reduxjs/toolkit';
import type { CreateWarehouseInventoryState } from './warehouseInventoryTypes';
import { createWarehouseInventoryRecordsThunk } from '@features/warehouseInventory/state/warehouseInventoryThunks';

const initialState: CreateWarehouseInventoryState = {
  loading: false,
  error: null,
  success: false,
  response: null,
};

const createWarehouseInventorySlice = createSlice({
  name: 'createWarehouseInventory',
  initialState,
  reducers: {
    resetCreateInventoryState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.response = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createWarehouseInventoryRecordsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createWarehouseInventoryRecordsThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
        }
      )
      .addCase(
        createWarehouseInventoryRecordsThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload ?? 'Unknown error';
        }
      );
  },
});

export const { resetCreateInventoryState } =
  createWarehouseInventorySlice.actions;
export default createWarehouseInventorySlice.reducer;
