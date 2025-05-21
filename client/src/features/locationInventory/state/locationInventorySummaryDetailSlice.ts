import { createSlice } from '@reduxjs/toolkit';
import type { LocationInventorySummaryDetailState } from './locationInventoryTypes';
import { fetchLocationInventorySummaryByItemIdThunk } from './locationInventoryThunks';

const initialState: LocationInventorySummaryDetailState = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,
};

const locationInventorySummaryDetailSlice = createSlice({
  name: 'locationInventorySummaryDetail',
  initialState,
  reducers: {
    resetLocationInventorySummaryDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationInventorySummaryByItemIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationInventorySummaryByItemIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchLocationInventorySummaryByItemIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load location inventory summary detail.';
      });
  },
});

export const {
  resetLocationInventorySummaryDetail,
} = locationInventorySummaryDetailSlice.actions;

export default locationInventorySummaryDetailSlice.reducer;
