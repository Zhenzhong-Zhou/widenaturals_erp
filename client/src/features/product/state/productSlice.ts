import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GeneralProductInfo, ProductState } from './productTypes.ts';
import { fetchProductsThunk } from './productThunks.ts';

// Initial state
const initialState: ProductState<GeneralProductInfo> = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,
};

// Product slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProductsThunk.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default productSlice.reducer;
