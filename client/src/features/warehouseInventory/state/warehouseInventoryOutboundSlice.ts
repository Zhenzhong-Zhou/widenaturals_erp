import { createSlice } from '@reduxjs/toolkit';
import { recordWarehouseInventoryOutboundThunk } from './warehouseInventoryThunks';
import type {
  WarehouseInventoryOutboundState,
  RecordWarehouseInventoryOutboundResponse,
} from './warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: WarehouseInventoryOutboundState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseInventoryOutboundSlice = createSlice({
  name: 'warehouseInventoryOutbound',
  initialState,
  reducers: {
    resetWarehouseInventoryOutbound: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(recordWarehouseInventoryOutboundThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(recordWarehouseInventoryOutboundThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const result = action.payload as RecordWarehouseInventoryOutboundResponse;
        
        state.data = result.data;
        state.success = result.success;
        state.message = result.message;
      })
      .addCase(recordWarehouseInventoryOutboundThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to record warehouse inventory outbound.');
      });
  },
});

export const { resetWarehouseInventoryOutbound } =
  warehouseInventoryOutboundSlice.actions;

export default warehouseInventoryOutboundSlice.reducer;
