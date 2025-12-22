import { createSlice } from '@reduxjs/toolkit';
import type {
  WarehouseInventoryItemSummaryState,
} from '@features/warehouseInventory/state';
import { fetchWarehouseInventoryItemSummaryThunk } from './warehouseInventoryThunks';

const initialState: WarehouseInventoryItemSummaryState = {
  data: [],
  pagination: null,
  loading: false,
  error: null,
};

const warehouseInventoryItemSummarySlice = createSlice({
  name: 'warehouseInventory/itemSummary',
  initialState,
  reducers: {
    resetWarehouseInventoryItemSummary: (state) => {
      state.data = [];
      state.pagination = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseInventoryItemSummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseInventoryItemSummaryThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(
        fetchWarehouseInventoryItemSummaryThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            (action.payload as string) ??
            'Failed to fetch warehouse inventory summary.';
        }
      );
  },
});

export const { resetWarehouseInventoryItemSummary } =
  warehouseInventoryItemSummarySlice.actions;
export default warehouseInventoryItemSummarySlice.reducer;
