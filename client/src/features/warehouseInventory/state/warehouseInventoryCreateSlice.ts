import { createSlice } from '@reduxjs/toolkit';
import { createWarehouseInventoryThunk } from './warehouseInventoryThunks';
import type {
  WarehouseInventoryCreateState,
  CreateWarehouseInventoryResponse,
} from './warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: WarehouseInventoryCreateState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseInventoryCreateSlice = createSlice({
  name: 'warehouseInventoryCreate',
  initialState,
  reducers: {
    resetWarehouseInventoryCreate: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createWarehouseInventoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(createWarehouseInventoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const result = action.payload as CreateWarehouseInventoryResponse;
        
        state.data = Array.isArray(result.data) ? result.data : [result.data];
        state.success = result.success;
        state.message = result.message;
      })
      .addCase(createWarehouseInventoryThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to create warehouse inventory record(s).');
      });
  },
});

export const { resetWarehouseInventoryCreate } =
  warehouseInventoryCreateSlice.actions;

export default warehouseInventoryCreateSlice.reducer;
