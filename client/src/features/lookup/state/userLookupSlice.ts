import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  UserLookupItem,
  UserLookupResponse,
  UserLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchUserLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

// -----------------------------
// Initial State
// -----------------------------
const initialState: UserLookupState =
  createInitialOffsetPaginatedState<UserLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const userLookupSlice = createSlice({
  name: 'userLookup',
  initialState,
  reducers: {
    /**
     * Reset User lookup to clean initial pagination state.
     * Recreates the state from factory to avoid shared references.
     */
    resetUserLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<UserLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserLookupThunk.fulfilled,
        (state, action: PayloadAction<UserLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchUserLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? 'Failed to fetch user lookup';
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetUserLookup } = userLookupSlice.actions;
export default userLookupSlice.reducer;
