import { createSlice } from '@reduxjs/toolkit';
import { adjustWarehouseInventoryQuantitiesThunk } from './warehouseInventoryThunks';
import type {
  WarehouseInventoryAdjustQuantityState,
  AdjustWarehouseInventoryQuantityResponse,
} from './warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: WarehouseInventoryAdjustQuantityState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseInventoryAdjustQuantitySlice = createSlice({
  name: 'warehouseInventoryAdjustQuantity',
  initialState,
  reducers: {
    resetWarehouseInventoryAdjustQuantity: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(adjustWarehouseInventoryQuantitiesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(adjustWarehouseInventoryQuantitiesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const result = action.payload as AdjustWarehouseInventoryQuantityResponse;
        
        state.data = Array.isArray(result.data) ? result.data : [result.data];
        state.success = result.success;
        state.message = result.message;
      })
      .addCase(adjustWarehouseInventoryQuantitiesThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to adjust warehouse inventory quantities.');
      });
  },
});

export const { resetWarehouseInventoryAdjustQuantity } =
  warehouseInventoryAdjustQuantitySlice.actions;

export default warehouseInventoryAdjustQuantitySlice.reducer;
