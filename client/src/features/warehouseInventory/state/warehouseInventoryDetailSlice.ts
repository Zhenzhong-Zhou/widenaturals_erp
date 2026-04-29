import { createSlice } from '@reduxjs/toolkit';
import { fetchWarehouseInventoryDetailThunk } from './warehouseInventoryThunks';
import type {
  WarehouseInventoryDetailState,
  WarehouseInventoryDetailResponse,
} from './warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: WarehouseInventoryDetailState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseInventoryDetailSlice = createSlice({
  name: 'warehouseInventoryDetail',
  initialState,
  reducers: {
    resetWarehouseInventoryDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseInventoryDetailThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(fetchWarehouseInventoryDetailThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const result = action.payload as WarehouseInventoryDetailResponse;
        state.data = result.data;
      })
      .addCase(fetchWarehouseInventoryDetailThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to fetch warehouse inventory detail.');
      });
  },
});

export const { resetWarehouseInventoryDetail } =
  warehouseInventoryDetailSlice.actions;

export default warehouseInventoryDetailSlice.reducer;
