import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  InventoryAllocationReviewResponse,
  InventoryAllocationReviewState,
} from './inventoryAllocationTypes';
import { fetchInventoryAllocationReviewThunk } from '@features/inventoryAllocation/state';

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
    setReviewError: (state, action: PayloadAction<string | null>) => {
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
          state.data = action.payload.data; // AsyncState<T>
          state.message = action.payload.message ?? null;
          state.error = null;
          state.lastFetchedAt = Date.now();
        }
      )
      .addCase(
        fetchInventoryAllocationReviewThunk.rejected,
        (state, action) => {
          state.loading = false;

          const payload = action.payload as unknown;
          state.error =
            (typeof payload === 'string' && payload) ||
            (payload &&
              typeof payload === 'object' &&
              ((payload as any).message ??
                (payload as any).error ??
                (payload as any)?.data?.message)) ||
            action.error.message ||
            'Failed to fetch allocation review';
        }
      );
  },
});

export const { resetInventoryAllocationReview, setReviewError } =
  inventoryAllocationReviewSlice.actions;

export default inventoryAllocationReviewSlice.reducer;
