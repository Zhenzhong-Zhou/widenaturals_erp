import { createSlice } from '@reduxjs/toolkit';
import { LocationInventorySummaryDetailState, LocationInventorySummaryItemDetail } from './locationInventoryTypes';
import { fetchLocationInventorySummaryByItemIdThunk } from './locationInventoryThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';
import { createInitialPaginatedState } from '@store/pagination';

const initialState: LocationInventorySummaryDetailState =
  createInitialPaginatedState<LocationInventorySummaryItemDetail>();

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
      .addCase(
        fetchLocationInventorySummaryByItemIdThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(
        fetchLocationInventorySummaryByItemIdThunk.rejected,
        (state, action) => {
          applyRejected(
            state,
            action,
            'Failed to load location inventory summary detail.'
          );
        }
      );
  },
});

export const { resetLocationInventorySummaryDetail } =
  locationInventorySummaryDetailSlice.actions;

export default locationInventorySummaryDetailSlice.reducer;
