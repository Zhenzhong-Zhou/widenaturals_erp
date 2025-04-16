import { createSlice } from '@reduxjs/toolkit';
import {
  type BulkInsertInventoryResponse,
  bulkInsertWarehouseInventoryThunk,
} from '@features/warehouseInventory';

interface WarehouseInventoryState {
  data: BulkInsertInventoryResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseInventoryState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseInventorySlice = createSlice({
  name: 'bulkInsertWarehouseInventory',
  initialState,
  reducers: {
    resetWarehouseInventoryState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bulkInsertWarehouseInventoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkInsertWarehouseInventoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(bulkInsertWarehouseInventoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetWarehouseInventoryState } = warehouseInventorySlice.actions;
export default warehouseInventorySlice.reducer;
