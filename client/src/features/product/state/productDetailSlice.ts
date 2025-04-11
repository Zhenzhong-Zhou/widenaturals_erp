import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product, ProductDetailState } from '@features/product/state/productTypes';
import { fetchProductDetailThunk } from '@features/product';

const initialState: ProductDetailState = {
  productDetail: null,
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductDetailThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchProductDetailThunk.fulfilled,
        (state, action: PayloadAction<Product>) => {
          state.loading = false;
          state.productDetail = action.payload;
        }
      )
      .addCase(fetchProductDetailThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default productSlice.reducer;
