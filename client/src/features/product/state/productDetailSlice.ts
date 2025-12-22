import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  GetProductApiResponse,
  ProductDetailState,
} from '@features/product/state/productTypes';
import { fetchProductDetailByIdThunk } from '@features/product/state/productThunks';

/**
 * Initial state for the Product detail slice.
 */
const initialState: ProductDetailState = {
  data: null,
  loading: false,
  error: null,
};

export const productDetailSlice = createSlice({
  name: 'productDetail',
  initialState,
  reducers: {
    /**
     * Optional: Allows manual reset of the detail state
     * (e.g., when navigating away from the Product Detail page).
     */
    resetProductDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // --- Pending ---
      .addCase(fetchProductDetailByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // --- Fulfilled ---
      .addCase(
        fetchProductDetailByIdThunk.fulfilled,
        (state, action: PayloadAction<GetProductApiResponse>) => {
          state.loading = false;
          state.data = action.payload.data; // unwrap API envelope
        }
      )
      
      // --- Rejected ---
      .addCase(fetchProductDetailByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          'Failed to load product details';
      });
  },
});

export const { resetProductDetail } = productDetailSlice.actions;

export default productDetailSlice.reducer;
