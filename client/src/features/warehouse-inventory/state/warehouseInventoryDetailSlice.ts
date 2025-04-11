import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  WarehouseInventoryDetail,
  WarehouseInventoryDetailsResponse,
  WarehouseInventoryPagination,
} from '@features/warehouse-inventory/state/warehouseInventoryTypes';
import { fetchWarehouseInventoryDetailsThunk } from '@features/warehouse-inventory';

interface WarehouseInventoryState {
  inventoryDetails: WarehouseInventoryDetail[];
  pagination: WarehouseInventoryPagination;
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseInventoryState = {
  inventoryDetails: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

const warehouseInventorySlice = createSlice({
  name: 'warehouseInventoryDetails',
  initialState,
  reducers: {
    resetWarehouseInventory: (state) => {
      state.inventoryDetails = [];
      state.pagination = { page: 1, limit: 10, totalRecords: 0, totalPages: 1 };
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseInventoryDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseInventoryDetailsThunk.fulfilled,
        (state, action: PayloadAction<WarehouseInventoryDetailsResponse>) => {
          state.inventoryDetails = action.payload.inventoryDetails;
          state.pagination = action.payload.pagination;
          state.loading = false;
        }
      )
      .addCase(
        fetchWarehouseInventoryDetailsThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { resetWarehouseInventory } = warehouseInventorySlice.actions;
export default warehouseInventorySlice.reducer;
