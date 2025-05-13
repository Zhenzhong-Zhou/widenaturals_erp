import { createSlice } from '@reduxjs/toolkit';
import type {
  SkuWarehouseInventorySummary,
  WarehouseInventoryPagination,
} from '@features/warehouseInventory/state/warehouseInventoryTypes.ts';
import { fetchSkuInventorySummaryThunk } from './warehouseInventoryThunks';

interface WarehouseInventorySkuSummaryState {
  data: SkuWarehouseInventorySummary[];
  pagination: WarehouseInventoryPagination | null;
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseInventorySkuSummaryState = {
  data: [],
  pagination: null,
  loading: false,
  error: null,
};

const warehouseInventorySkuSummarySlice = createSlice({
  name: 'warehouseInventory/skuSummary',
  initialState,
  reducers: {
    clearSkuInventorySummary: (state) => {
      state.data = [];
      state.pagination = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkuInventorySummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkuInventorySummaryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSkuInventorySummaryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to fetch SKU inventory summary.';
      });
  },
});

export const { clearSkuInventorySummary } = warehouseInventorySkuSummarySlice.actions;
export default warehouseInventorySkuSummarySlice.reducer;
