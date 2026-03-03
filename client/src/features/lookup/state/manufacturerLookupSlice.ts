import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ManufacturerLookupItem,
  ManufacturerLookupResponse,
  ManufacturerLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchManufacturerLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// -----------------------------
// Initial State
// -----------------------------
const initialState: ManufacturerLookupState =
  createInitialOffsetPaginatedState<ManufacturerLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const manufacturerLookupSlice = createSlice({
  name: 'manufacturerLookup',
  initialState,
  reducers: {
    /**
     * Reset Manufacturer lookup to clean initial pagination state.
     */
    resetManufacturerLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<ManufacturerLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManufacturerLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchManufacturerLookupThunk.fulfilled,
        (state, action: PayloadAction<ManufacturerLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchManufacturerLookupThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to fetch manufacturer lookup'
        );
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetManufacturerLookup } = manufacturerLookupSlice.actions;

export default manufacturerLookupSlice.reducer;
