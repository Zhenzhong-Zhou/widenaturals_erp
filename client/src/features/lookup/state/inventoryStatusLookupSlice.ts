import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  InventoryStatusLookupItem,
  InventoryStatusLookupResponse,
  InventoryStatusLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchInventoryStatusLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// -----------------------------
// Initial State
// -----------------------------
const initialState: InventoryStatusLookupState =
  createInitialOffsetPaginatedState<InventoryStatusLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const inventoryStatusLookupSlice = createSlice({
  name: 'inventoryStatusLookup',
  initialState,
  reducers: {
    /**
     * Reset Inventory Status lookup to clean initial pagination state.
     */
    resetInventoryStatusLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<InventoryStatusLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryStatusLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInventoryStatusLookupThunk.fulfilled,
        (state, action: PayloadAction<InventoryStatusLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchInventoryStatusLookupThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to fetch inventory status lookup'
        );
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetInventoryStatusLookup } =
  inventoryStatusLookupSlice.actions;

export default inventoryStatusLookupSlice.reducer;
