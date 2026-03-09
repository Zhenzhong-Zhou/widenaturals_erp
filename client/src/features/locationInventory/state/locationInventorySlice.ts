import { createSlice } from '@reduxjs/toolkit';
import type {
  LocationInventoryRecord,
  LocationInventoryState,
} from './locationInventoryTypes';
import { fetchLocationInventoryRecordsThunk } from '@features/locationInventory/state/locationInventoryThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';
import { createInitialPaginatedState } from '@store/pagination';

const initialState: LocationInventoryState =
  createInitialPaginatedState<LocationInventoryRecord>();

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
        applyRejected(
          state,
          action,
          'Failed to fetch location inventory records.'
        );
      });
  },
});

export const { clearLocationInventoryState } = locationInventorySlice.actions;
export default locationInventorySlice.reducer;
