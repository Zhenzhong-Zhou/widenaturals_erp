import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductDropdownItem } from './productTypes.ts';
import { fetchProductsForOrdersDropdownThunk } from './productThunks.ts';

interface ProductOrderDropdownState {
  products: ProductDropdownItem[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductOrderDropdownState = {
  products: [],
  loading: false,
  error: null,
};

const productOrderDropdownSlice = createSlice({
  name: 'productOrderDropdown',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsForOrdersDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsForOrdersDropdownThunk.fulfilled, (state, action: PayloadAction<ProductDropdownItem[]>) => {
        state.products = action.payload;
        state.loading = false;
      })
      .addCase(fetchProductsForOrdersDropdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default productOrderDropdownSlice.reducer;
