import { createSlice } from '@reduxjs/toolkit';
import { fetchWarehouseSummaryThunk } from './warehouseInventoryThunks';
import type {
  WarehouseSummaryState,
  WarehouseSummaryResponse,
} from './warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: WarehouseSummaryState = {
  data: null,
  loading: false,
  error: null,
};

const warehouseSummarySlice = createSlice({
  name: 'warehouseSummary',
  initialState,
  reducers: {
    resetWarehouseSummary: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseSummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(fetchWarehouseSummaryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const result = action.payload as WarehouseSummaryResponse;
        state.data = result.data;
      })
      .addCase(fetchWarehouseSummaryThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to fetch warehouse summary.');
      });
  },
});

export const { resetWarehouseSummary } = warehouseSummarySlice.actions;

export default warehouseSummarySlice.reducer;
