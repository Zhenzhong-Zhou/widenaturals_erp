import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  LocationLookupItem,
  LocationLookupResponse,
  LocationLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchLocationLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// -----------------------------
// Initial State
// -----------------------------
const initialState: LocationLookupState =
  createInitialOffsetPaginatedState<LocationLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const locationLookupSlice = createSlice({
  name: 'locationLookup',
  initialState,
  reducers: {
    /**
     * Reset Location lookup to clean initial pagination state.
     */
    resetLocationLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<LocationLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchLocationLookupThunk.fulfilled,
        (state, action: PayloadAction<LocationLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchLocationLookupThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch location lookup');
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetLocationLookup } = locationLookupSlice.actions;

export default locationLookupSlice.reducer;
