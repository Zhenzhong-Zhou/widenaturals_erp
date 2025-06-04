import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { adjustWarehouseInventoryQuantitiesThunk } from './warehouseInventoryThunks';
import type {
  InventoryRecordOutput,
  InventoryRecordsResponse,
} from '@features/inventoryShared/types/InventorySharedType';

interface AdjustInventoryState {
  warehouse: InventoryRecordOutput[];
  location: InventoryRecordOutput[];
  loading: boolean;
  error: string | null;
}

const initialState: AdjustInventoryState = {
  warehouse: [],
  location: [],
  loading: false,
  error: null,
};

const warehouseInventoryAdjustSlice = createSlice({
  name: 'warehouseInventoryAdjust',
  initialState,
  reducers: {
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
          state.warehouse = action.payload.data.warehouse;
          state.location = action.payload.data.location;
          state.error = null;
        }
      )
      .addCase(adjustWarehouseInventoryQuantitiesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error?.message || 'Failed to adjust inventory quantities';
      });
  },
});

export const { resetAdjustInventoryState } = warehouseInventoryAdjustSlice.actions;
export default warehouseInventoryAdjustSlice.reducer;
