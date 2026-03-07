import { createSlice } from '@reduxjs/toolkit';
import type {
  LocationInventorySummary,
  LocationInventorySummaryState,
} from './locationInventoryTypes';
import { fetchLocationInventorySummaryThunk } from '@features/locationInventory/state/locationInventoryThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';
import { createInitialPaginatedState } from '@store/pagination';

const initialState: LocationInventorySummaryState =
  createInitialPaginatedState<LocationInventorySummary>();

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
      .addCase(
        fetchLocationInventorySummaryThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchLocationInventorySummaryThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to fetch location inventory summary.'
        );
      });
  },
});

export const { clearLocationInventorySummary } =
  locationInventorySummarySlice.actions;

export default locationInventorySummarySlice.reducer;
