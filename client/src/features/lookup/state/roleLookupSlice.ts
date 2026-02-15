import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RoleLookupItem,
  RoleLookupResponse,
  RoleLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchRoleLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

// -----------------------------
// Initial State
// -----------------------------
const initialState: RoleLookupState =
  createInitialOffsetPaginatedState<RoleLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const roleLookupSlice = createSlice({
  name: 'roleLookup',
  initialState,
  reducers: {
    /**
     * Reset Role lookup to clean initial pagination state.
     * Recreates the state from factory to avoid shared references.
     */
    resetRoleLookup: (state) => {
      Object.assign(state, createInitialOffsetPaginatedState<RoleLookupItem>());
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoleLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRoleLookupThunk.fulfilled,
        (state, action: PayloadAction<RoleLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchRoleLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? 'Failed to fetch role lookup';
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetRoleLookup } = roleLookupSlice.actions;
export default roleLookupSlice.reducer;
