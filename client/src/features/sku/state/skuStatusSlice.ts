import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  SkuStatusState,
  UpdateSkuStatusResponse,
} from '@features/sku/state/skuTypes';
import { updateSkuStatusThunk } from '@features/sku/state/skuThunks';

const initialState: SkuStatusState = {
  data: null, // holds ApiSuccessResponse or null
  loading: false,
  error: null,
};

export const skuStatusSlice = createSlice({
  name: 'skuStatus',
  initialState,
  reducers: {
    /** Reset back to initial async state */
    resetSkuStatus: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // -------------------------
      // UPDATE SKU STATUS
      // -------------------------
      .addCase(updateSkuStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        updateSkuStatusThunk.fulfilled,
        (state, action: PayloadAction<UpdateSkuStatusResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )
      .addCase(updateSkuStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to update SKU status';
      });
  },
});

export const { resetSkuStatus } = skuStatusSlice.actions;

export default skuStatusSlice.reducer;
