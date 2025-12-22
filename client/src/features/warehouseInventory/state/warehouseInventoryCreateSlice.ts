import { createSlice } from '@reduxjs/toolkit';
import type { CreateWarehouseInventoryState } from './warehouseInventoryTypes';
import { createWarehouseInventoryRecordsThunk } from '@features/warehouseInventory/state/warehouseInventoryThunks';

const initialState: CreateWarehouseInventoryState = {
  data: null,
  loading: false,
  error: null,
};

const createWarehouseInventorySlice = createSlice({
  name: 'createWarehouseInventory',
  initialState,
  reducers: {
    resetCreateWarehouseInventory: (state) => {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createWarehouseInventoryRecordsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createWarehouseInventoryRecordsThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload;
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

export const { resetCreateWarehouseInventory } =
  createWarehouseInventorySlice.actions;
export default createWarehouseInventorySlice.reducer;
