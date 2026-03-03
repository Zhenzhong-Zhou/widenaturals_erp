import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ProductUpdateState,
  UpdateProductApiResponse,
} from '@features/product/state/productTypes';
import { updateProductInfoByIdThunk } from '@features/product/state/productThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: ProductUpdateState = {
  data: null,
  loading: false,
  error: null,
};

export const productInfoUpdateSlice = createSlice({
  name: 'productInfoUpdate',
  initialState,
  reducers: {
    /** Reset back to initial async state */
    resetProductInfoUpdate: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // -------------------------
      // UPDATE PRODUCT INFO
      // -------------------------
      .addCase(updateProductInfoByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        updateProductInfoByIdThunk.fulfilled,
        (state, action: PayloadAction<UpdateProductApiResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )
      
      .addCase(updateProductInfoByIdThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to update product information.');
      })
  },
});

export const { resetProductInfoUpdate } = productInfoUpdateSlice.actions;

export default productInfoUpdateSlice.reducer;
