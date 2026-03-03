import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  GetSkuDetailResponse,
  SkuDetailState,
} from '@features/sku/state/skuTypes';
import { getSkuDetailByIdThunk } from '@features/sku/state/skuThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

/**
 * Initial state for the SKU detail slice.
 */
const initialState: SkuDetailState = {
  data: null,
  loading: false,
  error: null,
};

export const skuDetailSlice = createSlice({
  name: 'skuDetail',
  initialState,
  reducers: {
    /**
     * Optional: Allows manual reset of the detail state
     * (e.g., when unmounting a details page).
     */
    resetSkuDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // --- Pending ---
      .addCase(getSkuDetailByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // --- Fulfilled ---
      .addCase(
        getSkuDetailByIdThunk.fulfilled,
        (state, action: PayloadAction<GetSkuDetailResponse>) => {
          state.loading = false;
          state.data = action.payload.data; // normalized API payload
        }
      )

      // --- Rejected ---
      .addCase(getSkuDetailByIdThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to load SKU details.');
      });
  },
});

export const { resetSkuDetail } = skuDetailSlice.actions;

export default skuDetailSlice.reducer;
