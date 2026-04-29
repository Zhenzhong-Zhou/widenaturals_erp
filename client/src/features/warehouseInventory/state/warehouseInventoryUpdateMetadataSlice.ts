import { createSlice } from '@reduxjs/toolkit';
import { updateWarehouseInventoryMetadataThunk } from './warehouseInventoryThunks';
import type {
  WarehouseInventoryUpdateMetadataState,
  UpdateWarehouseInventoryMetadataResponse,
} from './warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: WarehouseInventoryUpdateMetadataState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseInventoryUpdateMetadataSlice = createSlice({
  name: 'warehouseInventoryUpdateMetadata',
  initialState,
  reducers: {
    resetWarehouseInventoryUpdateMetadata: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateWarehouseInventoryMetadataThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(updateWarehouseInventoryMetadataThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const result = action.payload as UpdateWarehouseInventoryMetadataResponse;
        
        state.data = result.data;
        state.success = result.success;
        state.message = result.message;
      })
      .addCase(updateWarehouseInventoryMetadataThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to update warehouse inventory metadata.');
      });
  },
});

export const { resetWarehouseInventoryUpdateMetadata } =
  warehouseInventoryUpdateMetadataSlice.actions;

export default warehouseInventoryUpdateMetadataSlice.reducer;
