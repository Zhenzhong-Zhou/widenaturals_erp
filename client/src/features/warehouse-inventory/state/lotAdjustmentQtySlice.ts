import { createSlice } from '@reduxjs/toolkit';
import { LotAdjustmentQtyState } from './warehouseInventoryTypes.ts';
import {
  adjustWarehouseInventoryLotThunk,
  bulkAdjustWarehouseInventoryLotsQtyThunk,
} from './lotAdjustmentThunks.ts';

const initialState: LotAdjustmentQtyState = {
  loadingSingle: false,
  loadingBulk: false,
  errorSingle: null,
  errorBulk: null,
  successSingle: false,
  successBulk: false,
};

const lotAdjustmentSlice = createSlice({
  name: 'lotAdjustment',
  initialState,
  reducers: {
    resetLotAdjustmentState: (state) => {
      state.loadingSingle = false;
      state.loadingBulk = false;
      state.errorSingle = null;
      state.errorBulk = null;
      state.successSingle = false;
      state.successBulk = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Single Lot Adjustment
      .addCase(adjustWarehouseInventoryLotThunk.pending, (state) => {
        state.loadingSingle = true;
        state.errorSingle = null;
        state.successSingle = false;
      })
      .addCase(adjustWarehouseInventoryLotThunk.fulfilled, (state) => {
        state.loadingSingle = false;
        state.successSingle = true;
      })
      .addCase(adjustWarehouseInventoryLotThunk.rejected, (state, action) => {
        state.loadingSingle = false;
        state.errorSingle = action.payload as string;
      })

      // Bulk Lot Adjustment
      .addCase(bulkAdjustWarehouseInventoryLotsQtyThunk.pending, (state) => {
        state.loadingBulk = true;
        state.errorBulk = null;
        state.successBulk = false;
      })
      .addCase(bulkAdjustWarehouseInventoryLotsQtyThunk.fulfilled, (state) => {
        state.loadingBulk = false;
        state.successBulk = true;
      })
      .addCase(
        bulkAdjustWarehouseInventoryLotsQtyThunk.rejected,
        (state, action) => {
          state.loadingBulk = false;
          state.errorBulk = action.payload as string;
        }
      );
  },
});

export const { resetLotAdjustmentState } = lotAdjustmentSlice.actions;
export default lotAdjustmentSlice.reducer;
