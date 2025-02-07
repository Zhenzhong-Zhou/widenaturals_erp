import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchWarehouseInventoriesThunk } from './warehouseInventoryThunks.ts';
import {
  WarehouseInventoryResponse,
  WarehouseInventory,
  Pagination,
} from './warehouseInventoryTypes.ts';

interface WarehouseInventoryState {
  inventories: WarehouseInventory[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseInventoryState = {
  inventories: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,
};

const warehouseInventorySlice = createSlice({
  name: 'warehouseInventory',
  initialState,
  reducers: {
    resetWarehouseInventory: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseInventoriesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouseInventoriesThunk.fulfilled, (state, action: PayloadAction<WarehouseInventoryResponse>) => {
        state.inventories = action.payload.inventories;
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addCase(fetchWarehouseInventoriesThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load warehouse inventories';
      });
  },
});

export const { resetWarehouseInventory } = warehouseInventorySlice.actions;
export default warehouseInventorySlice.reducer;
