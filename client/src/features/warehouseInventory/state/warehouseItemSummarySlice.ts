import { createSlice } from '@reduxjs/toolkit';
import { fetchWarehouseItemSummaryThunk } from './warehouseInventoryThunks';
import type {
  WarehouseItemSummaryState,
  WarehouseItemSummaryResponse,
} from './warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: WarehouseItemSummaryState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseItemSummarySlice = createSlice({
  name: 'warehouseItemSummary',
  initialState,
  reducers: {
    resetWarehouseItemSummary: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseItemSummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(fetchWarehouseItemSummaryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const result = action.payload as WarehouseItemSummaryResponse;
        state.data = result.data;
      })
      .addCase(fetchWarehouseItemSummaryThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to fetch warehouse item summary.');
      });
  },
});

export const { resetWarehouseItemSummary } = warehouseItemSummarySlice.actions;

export default warehouseItemSummarySlice.reducer;
