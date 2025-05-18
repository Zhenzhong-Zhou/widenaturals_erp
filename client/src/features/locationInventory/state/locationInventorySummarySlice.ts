import { createSlice } from '@reduxjs/toolkit';
import type { LocationInventorySummaryState } from './locationInventoryTypes';
import {
  fetchLocationInventorySummaryThunk
} from '@features/locationInventory/state/locationInventoryThunks';

const initialState: LocationInventorySummaryState = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

export const locationInventorySummarySlice = createSlice({
  name: 'locationInventorySummary',
  initialState,
  reducers: {
    clearLocationInventorySummary: (state) => {
      state.data = [];
      state.pagination = initialState.pagination;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationInventorySummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationInventorySummaryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchLocationInventorySummaryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch location inventory summary';
      });
  },
});

export const { clearLocationInventorySummary } = locationInventorySummarySlice.actions;

export default locationInventorySummarySlice.reducer;
