import { createAsyncThunk } from '@reduxjs/toolkit';
import { dropdownService, productService } from '../../../services';
import { Product, ProductDropdownItem } from './productTypes.ts';

// Async thunk for fetching products
export const fetchProductsThunk = createAsyncThunk(
  'products/fetchProducts',
  async ({ page, limit }: { page: number; limit: number }, thunkAPI) => {
    try {
      return await productService.fetchProducts(page, limit);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch products'
      );
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
      return await productService.fetchProductDetails(productId);
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch product details'
      );
    }
  }
);

/**
 * Thunk to fetch products for the Orders dropdown.
 */
export const fetchProductsForOrdersDropdownThunk = createAsyncThunk<
  ProductDropdownItem[], // Expected response type
  { search?: string | null; limit?: number }, // Parameters
  { rejectValue: string } // Rejection error type
>(
  'products/fetchProductsForOrdersDropdown',
  async ({ search = null, limit = 100 }, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchProductsForOrdersDropdown(search, limit); // Successfully return the fetched data
    } catch (error) {
      console.error('Error fetching products for orders dropdown:', error);
      return rejectWithValue('Failed to fetch products for orders dropdown.');
    }
  }
);
