import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  ProductStatusUpdateState,
  UpdateProductApiResponse,
} from '@features/product/state/productTypes';
import { updateProductStatusByIdThunk } from '@features/product/state/productThunks';

const initialState: ProductStatusUpdateState = {
  data: null,
  loading: false,
  error: null,
};

export const productStatusUpdateSlice = createSlice({
  name: 'productStatusUpdate',
  initialState,
  reducers: {
    /** Reset back to initial async state */
    resetProductStatusUpdate: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // -------------------------
      // UPDATE PRODUCT STATUS
      // -------------------------
      .addCase(updateProductStatusByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        updateProductStatusByIdThunk.fulfilled,
        (state, action: PayloadAction<UpdateProductApiResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )

      .addCase(updateProductStatusByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to update product status';
      });
  },
});

export const { resetProductStatusUpdate } = productStatusUpdateSlice.actions;

export default productStatusUpdateSlice.reducer;
