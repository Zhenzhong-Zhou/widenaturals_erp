import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  LotAdjustmentTypeLookupItem,
  LotAdjustmentTypeLookupResponse,
  LotAdjustmentTypeLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchLotAdjustmentTypeLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// -----------------------------
// Initial State
// -----------------------------
const initialState: LotAdjustmentTypeLookupState =
  createInitialOffsetPaginatedState<LotAdjustmentTypeLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const lotAdjustmentTypeLookupSlice = createSlice({
  name: 'lotAdjustmentTypeLookup',
  initialState,
  reducers: {
    /**
     * Reset lot adjustment type lookup to clean initial pagination state.
     */
    resetLotAdjustmentTypeLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<LotAdjustmentTypeLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLotAdjustmentTypeLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchLotAdjustmentTypeLookupThunk.fulfilled,
        (state, action: PayloadAction<LotAdjustmentTypeLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchLotAdjustmentTypeLookupThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to fetch lot adjustment type lookup'
        );
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetLotAdjustmentTypeLookup } =
  lotAdjustmentTypeLookupSlice.actions;

export default lotAdjustmentTypeLookupSlice.reducer;
