import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  WarehouseTypeLookupItem,
  WarehouseTypeLookupResponse,
  WarehouseTypeLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchWarehouseTypeLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// -----------------------------
// Initial State
// -----------------------------
const initialState: WarehouseTypeLookupState =
  createInitialOffsetPaginatedState<WarehouseTypeLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const warehouseTypeLookupSlice = createSlice({
  name: 'warehouseTypeLookup',
  initialState,
  reducers: {
    /**
     * Reset Warehouse Type lookup to clean initial pagination state.
     */
    resetWarehouseTypeLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<WarehouseTypeLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseTypeLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseTypeLookupThunk.fulfilled,
        (state, action: PayloadAction<WarehouseTypeLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchWarehouseTypeLookupThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch warehouse type lookup');
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetWarehouseTypeLookup } = warehouseTypeLookupSlice.actions;

export default warehouseTypeLookupSlice.reducer;
