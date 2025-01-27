import { createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '../../../services';

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page, limit }: { page: number; limit: number }, thunkAPI) => {
    try {
      return await productService.fetchProducts(page, limit);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);