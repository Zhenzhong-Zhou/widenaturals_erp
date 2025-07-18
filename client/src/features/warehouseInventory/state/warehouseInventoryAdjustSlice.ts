import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { adjustWarehouseInventoryQuantitiesThunk } from './warehouseInventoryThunks';
import type { InventoryRecordsResponse } from '@features/inventoryShared/types/InventorySharedType';
import type { AdjustInventoryState } from './warehouseInventoryTypes';

const initialState: AdjustInventoryState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseInventoryAdjustSlice = createSlice({
  name: 'warehouseInventoryAdjust',
  initialState,
  reducers: {
    /**
     * Resets the inventory adjustment state to initial.
     */
    resetAdjustInventoryState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(adjustWarehouseInventoryQuantitiesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        adjustWarehouseInventoryQuantitiesThunk.fulfilled,
        (state, action: PayloadAction<InventoryRecordsResponse>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(
        adjustWarehouseInventoryQuantitiesThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            (action.payload as string) ||
            action.error?.message ||
            'Failed to adjust inventory quantities';
        }
      );
  },
});

export const { resetAdjustInventoryState } =
  warehouseInventoryAdjustSlice.actions;
export default warehouseInventoryAdjustSlice.reducer;
