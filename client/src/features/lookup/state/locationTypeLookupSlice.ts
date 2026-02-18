import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  LocationTypeLookupItem,
  LocationTypeLookupResponse,
  LocationTypeLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchLocationTypeLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

// -----------------------------
// Initial State
// -----------------------------
const initialState: LocationTypeLookupState =
  createInitialOffsetPaginatedState<LocationTypeLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const locationTypeLookupSlice = createSlice({
  name: 'locationTypeLookup',
  initialState,
  reducers: {
    /**
     * Reset Location Type lookup to clean initial pagination state.
     */
    resetLocationTypeLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<LocationTypeLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationTypeLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchLocationTypeLookupThunk.fulfilled,
        (state, action: PayloadAction<LocationTypeLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchLocationTypeLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? 'Failed to fetch location type lookup';
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetLocationTypeLookup } = locationTypeLookupSlice.actions;

export default locationTypeLookupSlice.reducer;
