import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type StatusLookupItem,
  type StatusLookupResponse,
  type StatusLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchStatusLookupThunk } from './lookupThunks';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

// -----------------------------
// Initial State
// -----------------------------
const initialState: StatusLookupState =
  createInitialPaginatedLookupState<StatusLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const statusLookupSlice = createSlice({
  name: 'statusLookup',
  initialState,
  reducers: {
    /**
     * Reset Status lookup to the initial paginated state.
     * Uses factory function to avoid shared references.
     */
    resetStatusLookup: (state) => {
      Object.assign(
        state,
        createInitialPaginatedLookupState<StatusLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatusLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchStatusLookupThunk.fulfilled,
        (state, action: PayloadAction<StatusLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchStatusLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? 'Failed to fetch status lookup';
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetStatusLookup } = statusLookupSlice.actions;
export default statusLookupSlice.reducer;
