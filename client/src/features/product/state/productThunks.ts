import { createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '../../../services';
import { fetchProductDetails } from '../../../services/productService.ts';
import { Product } from './productTypes.ts';

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

/**
 * Fetch product details thunk
 */
export const fetchProductDetailThunk = createAsyncThunk<Product, string>(
  'product/fetchDetail',
  async (productId, { rejectWithValue }) => {
    try {
      return await fetchProductDetails(productId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch product details');
    }
  }
);
