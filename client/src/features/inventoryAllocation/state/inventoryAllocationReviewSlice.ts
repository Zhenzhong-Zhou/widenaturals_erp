import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  InventoryAllocationReviewResponse,
  InventoryAllocationReviewState,
} from './inventoryAllocationTypes';
import { fetchInventoryAllocationReviewThunk } from '@features/inventoryAllocation/state';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: InventoryAllocationReviewState = {
  data: null,
  loading: false,
  error: null,
  message: null,
  lastFetchedAt: null,
};

const inventoryAllocationReviewSlice = createSlice({
  name: 'inventoryAllocationReview',
  initialState,
  reducers: {
    /** Reset the slice back to its initial state. */
    resetInventoryAllocationReview: () => initialState,
    /** Manually set error and stop loading (optional utility). */
    setReviewError: (state, action: PayloadAction<UiErrorPayload | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryAllocationReviewThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInventoryAllocationReviewThunk.fulfilled,
        (state, action: PayloadAction<InventoryAllocationReviewResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.message = action.payload.message ?? null;
          state.error = null;
          state.lastFetchedAt = Date.now();
        }
      )
      .addCase(
        fetchInventoryAllocationReviewThunk.rejected,
        (state, action) => {
          applyRejected(state, action, 'Failed to fetch allocation review');
        }
      );
  },
});

export const { resetInventoryAllocationReview, setReviewError } =
  inventoryAllocationReviewSlice.actions;

export default inventoryAllocationReviewSlice.reducer;
