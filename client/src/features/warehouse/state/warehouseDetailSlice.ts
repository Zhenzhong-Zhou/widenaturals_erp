/**
 * @file warehouseDetailSlice.ts
 *
 * Redux slice for the warehouse detail view.
 */

import { createSlice } from '@reduxjs/toolkit';
import { fetchWarehouseByIdThunk } from './warehouseThunks';
import type {
  WarehouseDetailState,
  WarehouseDetailApiResponse,
} from './warehouseTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const detailInitialState: WarehouseDetailState = {
  data:    null,
  loading: false,
  error:   null,
};

const warehouseDetailSlice = createSlice({
  name: 'warehouseDetail',
  initialState: detailInitialState,
  
  reducers: {
    /**
     * Reset the warehouse detail state back to its initial empty configuration.
     * Typically used when navigating away from the warehouse detail page.
     */
    resetWarehouseDetail: () => detailInitialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchWarehouseByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      
      // ---- fulfilled ----
      .addCase(fetchWarehouseByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const result = action.payload as WarehouseDetailApiResponse;
        state.data = result.data;
      })
      
      // ---- rejected ----
      .addCase(fetchWarehouseByIdThunk.rejected, (state, action) => {
        state.data = null;
        applyRejected(state, action, 'Failed to fetch warehouse details.');
      });
  },
});

export const { resetWarehouseDetail } = warehouseDetailSlice.actions;

export default warehouseDetailSlice.reducer;
