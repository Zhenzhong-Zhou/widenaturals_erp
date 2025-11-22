import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GetSkuDetailResponse, SkuDetailState } from '@features/sku/state/skuTypes';
import { getSkuDetailByIdThunk } from '@features/sku/state/skuThunks';

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
    resetSkuDetailState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // --- Pending ---
      .addCase(getSkuDetailByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // --- Fulfilled ---
      .addCase(getSkuDetailByIdThunk.fulfilled, (state, action: PayloadAction<GetSkuDetailResponse>) => {
        state.loading = false;
        state.data = action.payload.data; // normalized API payload
      })
      
      // --- Rejected ---
      .addCase(getSkuDetailByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || 'Failed to load SKU details';
      });
  },
});

export const { resetSkuDetailState } = skuDetailSlice.actions;

export default skuDetailSlice.reducer;
