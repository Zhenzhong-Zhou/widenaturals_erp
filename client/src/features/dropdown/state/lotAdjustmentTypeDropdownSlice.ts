import { createSlice } from '@reduxjs/toolkit';
import type { LotAdjustmentTypeDropdownState } from '@features/dropdown/state/dropdownTypes';
import { fetchLotAdjustmentTypeDropdownThunk } from '@features/dropdown/state/dropdownThunks';

const initialState: LotAdjustmentTypeDropdownState = {
  data: [],
  loading: false,
  error: null,
};

const lotAdjustmentTypeDropdownSlice = createSlice({
  name: 'lotAdjustmentTypeDropdown',
  initialState,
  reducers: {
    resetLotAdjustmentTypeDropdown(state) {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLotAdjustmentTypeDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLotAdjustmentTypeDropdownThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(fetchLotAdjustmentTypeDropdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetLotAdjustmentTypeDropdown } = lotAdjustmentTypeDropdownSlice.actions;
export default lotAdjustmentTypeDropdownSlice.reducer;
