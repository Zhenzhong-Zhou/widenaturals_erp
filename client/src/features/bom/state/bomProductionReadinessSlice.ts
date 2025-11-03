import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchBomProductionSummaryThunk } from './bomThunks';
import type {
  BomProductionReadinessResponse,
  BomProductionReadinessState,
} from '@features/bom/state/bomTypes';

/**
 * Redux slice for managing BOM Production Readiness Summary state.
 *
 * Handles loading, success, and error states for {@link fetchBomProductionSummaryThunk}.
 * Provides helper flags for production readiness and bottleneck tracking.
 *
 * Used by:
 * - BOM Production Summary Page
 * - Manufacturing Readiness Dashboard
 * - Production Planning Module
 */
const initialState: BomProductionReadinessState = {
  data: null,
  loading: false,
  error: null,
  selectedBomId: null,
  isReadyForProduction: false,
  bottleneckCount: 0,
};

export const bomProductionReadinessSlice = createSlice({
  name: 'bomProductionReadiness',
  initialState,
  reducers: {
    /**
     * Resets the entire readiness state to its initial values.
     * Useful when navigating between different BOM detail pages
     * or performing a full reload.
     */
    resetBomProductionReadiness: () => initialState,

    /**
     * Sets the currently selected BOM ID manually.
     * Allows the UI to track which BOM context is active.
     */
    setSelectedBomId: (state, action: PayloadAction<string | null>) => {
      state.selectedBomId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBomProductionSummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBomProductionSummaryThunk.fulfilled,
        (state, action: PayloadAction<BomProductionReadinessResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.isReadyForProduction =
            !!action.payload.data.metadata?.isReadyForProduction;
          state.bottleneckCount =
            action.payload.data.metadata?.bottleneckParts?.length ?? 0;
        }
      )
      .addCase(fetchBomProductionSummaryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string })?.message ||
          'Failed to fetch BOM production summary.';
      });
  },
});

// Export actions
export const { resetBomProductionReadiness, setSelectedBomId } =
  bomProductionReadinessSlice.actions;

// Export reducer
export default bomProductionReadinessSlice.reducer;
