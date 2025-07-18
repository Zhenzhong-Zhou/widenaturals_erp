import { createSlice } from '@reduxjs/toolkit';
import type { LocationInventoryKpiSummaryState } from '@features/locationInventory/state/locationInventoryTypes';
import { fetchLocationInventoryKpiSummaryThunk } from '@features/locationInventory/state/locationInventoryThunks';

const initialState: LocationInventoryKpiSummaryState = {
  data: [],
  loading: false,
  error: null,
};

const locationInventoryKpiSummarySlice = createSlice({
  name: 'locationInventoryKpiSummary',
  initialState,
  reducers: {
    clearKpiSummary(state) {
      state.data = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationInventoryKpiSummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchLocationInventoryKpiSummaryThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload.data;
        }
      )
      .addCase(
        fetchLocationInventoryKpiSummaryThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { clearKpiSummary } = locationInventoryKpiSummarySlice.actions;
export default locationInventoryKpiSummarySlice.reducer;
