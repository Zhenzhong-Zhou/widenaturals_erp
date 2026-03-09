import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  UpdateSkuDimensionsState,
  UpdateSkuDimensionsResponse,
} from '@features/sku/state/skuTypes';
import { updateSkuDimensionsThunk } from '@features/sku/state/skuThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: UpdateSkuDimensionsState = {
  data: null,
  loading: false,
  error: null,
};

export const skuDimensionsSlice = createSlice({
  name: 'skuDimensions',
  initialState,
  reducers: {
    resetSkuDimensions: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateSkuDimensionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateSkuDimensionsThunk.fulfilled,
        (state, action: PayloadAction<UpdateSkuDimensionsResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )
      .addCase(updateSkuDimensionsThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to update SKU dimensions.');
      });
  },
});

export const { resetSkuDimensions } = skuDimensionsSlice.actions;

export default skuDimensionsSlice.reducer;
