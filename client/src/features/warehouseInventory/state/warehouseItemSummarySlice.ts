import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  WarehouseInventoryPagination,
  WarehouseItemSummary,
  WarehouseItemSummaryResponse,
} from '@features/warehouseInventory/state/warehouseInventoryTypes';
import { fetchWarehouseItemSummaryThunk } from '@features/warehouseInventory';

export interface WarehouseItemSummaryState {
  itemSummaryData: WarehouseItemSummary[];
  pagination: WarehouseInventoryPagination;
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseItemSummaryState = {
  itemSummaryData: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 0 },
  loading: false,
  error: null,
};

const warehouseItemSlice = createSlice({
  name: 'warehouseItems',
  initialState,
  reducers: {
    resetWarehouseItemSummary: (state) => {
      state.itemSummaryData = [];
      state.pagination = { page: 1, limit: 10, totalRecords: 0, totalPages: 0 };
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseItemSummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseItemSummaryThunk.fulfilled,
        (state, action: PayloadAction<WarehouseItemSummaryResponse>) => {
          state.loading = false;
          state.itemSummaryData = action.payload.itemSummaryData;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchWarehouseItemSummaryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetWarehouseItemSummary } = warehouseItemSlice.actions;
export default warehouseItemSlice.reducer;
