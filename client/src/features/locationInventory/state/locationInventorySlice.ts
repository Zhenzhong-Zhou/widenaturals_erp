import { createSlice } from '@reduxjs/toolkit';
import type { LocationInventoryState } from './locationInventoryTypes';
import { fetchLocationInventoryRecordsThunk } from '@features/locationInventory/state/locationInventoryThunks.ts';

const initialState: LocationInventoryState = {
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

const locationInventorySlice = createSlice({
  name: 'locationInventory',
  initialState,
  reducers: {
    clearLocationInventoryState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationInventoryRecordsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchLocationInventoryRecordsThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchLocationInventoryRecordsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLocationInventoryState } = locationInventorySlice.actions;
export default locationInventorySlice.reducer;
