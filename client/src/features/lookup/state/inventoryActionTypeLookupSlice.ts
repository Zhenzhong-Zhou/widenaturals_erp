import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  InventoryActionTypeLookupItem,
  InventoryActionTypeLookupResponse,
  InventoryActionTypeLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchInventoryActionTypeLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// -----------------------------
// Initial State
// -----------------------------
const initialState: InventoryActionTypeLookupState =
  createInitialOffsetPaginatedState<InventoryActionTypeLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const inventoryActionTypeLookupSlice = createSlice({
  name: 'inventoryActionTypeLookup',
  initialState,
  reducers: {
    /**
     * Reset inventory action type lookup to clean initial pagination state.
     */
    resetInventoryActionTypeLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<InventoryActionTypeLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryActionTypeLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInventoryActionTypeLookupThunk.fulfilled,
        (state, action: PayloadAction<InventoryActionTypeLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(
        fetchInventoryActionTypeLookupThunk.rejected,
        (state, action) => {
          applyRejected(
            state,
            action,
            'Failed to fetch inventory action type lookup'
          );
        }
      );
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetInventoryActionTypeLookup } =
  inventoryActionTypeLookupSlice.actions;

export default inventoryActionTypeLookupSlice.reducer;
