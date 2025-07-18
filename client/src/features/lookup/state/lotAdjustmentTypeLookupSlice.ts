import { createSlice } from '@reduxjs/toolkit';
import type { LotAdjustmentTypeLookupState } from '@features/lookup/state/lookupTypes';
import { fetchLotAdjustmentTypeLookupThunk } from '@features/lookup/state/lookupThunks';

const initialState: LotAdjustmentTypeLookupState = {
  data: [],
  loading: false,
  error: null,
};

const lotAdjustmentTypeLookupSlice = createSlice({
  name: 'lotAdjustmentTypeLookup',
  initialState,
  reducers: {
    resetLotAdjustmentTypeLookup(state) {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLotAdjustmentTypeLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLotAdjustmentTypeLookupThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(fetchLotAdjustmentTypeLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to fetch lot adjustment types';
      });
  },
});

export const { resetLotAdjustmentTypeLookup } = lotAdjustmentTypeLookupSlice.actions;
export default lotAdjustmentTypeLookupSlice.reducer;
