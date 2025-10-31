import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BomDetailsResponse, BomDetailsState } from './bomTypes';
import { fetchBomDetailsThunk } from './bomThunks';

const initialState: BomDetailsState = {
  data: null,
  loading: false,
  error: null,
};

/**
 * Redux slice to manage BOM details fetched via `/boms/:bomId/details`.
 *
 * Uses the generic `AsyncState` structure for consistency across modules.
 */
export const bomDetailsSlice = createSlice({
  name: 'bomDetails',
  initialState,
  reducers: {
    /**
     * Reset BOM details to the initial state (e.g., when leaving the details page).
     */
    resetBomDetails: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBomDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBomDetailsThunk.fulfilled, (state, action: PayloadAction<BomDetailsResponse>) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(fetchBomDetailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load BOM details.';
      });
  },
});

export const { resetBomDetails } = bomDetailsSlice.actions;
export default bomDetailsSlice.reducer;
