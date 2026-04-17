import { createSlice } from '@reduxjs/toolkit';
import { updateWarehouseInventoryStatusesThunk } from './warehouseInventoryThunks';
import type {
  WarehouseInventoryUpdateStatusState,
  UpdateWarehouseInventoryStatusResponse,
} from './warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: WarehouseInventoryUpdateStatusState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseInventoryUpdateStatusSlice = createSlice({
  name: 'warehouseInventoryUpdateStatus',
  initialState,
  reducers: {
    resetWarehouseInventoryUpdateStatus: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateWarehouseInventoryStatusesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(updateWarehouseInventoryStatusesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const result = action.payload as UpdateWarehouseInventoryStatusResponse;
        
        state.data = result.data;
        state.success = result.success;
        state.message = result.message;
      })
      .addCase(updateWarehouseInventoryStatusesThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to update warehouse inventory statuses.');
      });
  },
});

export const { resetWarehouseInventoryUpdateStatus } =
  warehouseInventoryUpdateStatusSlice.actions;

export default warehouseInventoryUpdateStatusSlice.reducer;
