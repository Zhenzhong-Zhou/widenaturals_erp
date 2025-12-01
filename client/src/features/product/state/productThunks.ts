import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateProductBulkInput,
  CreateProductResponse
} from '@features/product/state/productTypes';
import { productService } from '@services/productService';

/**
 * Async thunk: Create one or more products.
 *
 * This thunk wraps the `productService.createProducts()` call and provides
 * a normalized, Redux-friendly interface for managing loading, success,
 * and error states related to bulk product creation.
 *
 * ## Behavior
 * - Dispatches pending → fulfilled/rejected lifecycle actions.
 * - Sends a payload containing one or more product definitions.
 * - Returns the API response (`CreateProductResponse`) on success.
 * - Normalizes backend and network errors into a clean string for slice handling.
 *
 * ## Usage
 * ```ts
 * const payload: CreateProductBulkInput = {
 *   products: [
 *     { name: "Vitamin D3", brand: "Wide Naturals", category: "Supplements" }
 *   ]
 * };
 *
 * const result = await dispatch(createProductsThunk(payload));
 *
 * if (createProductsThunk.fulfilled.match(result)) {
 *   console.log("Created IDs:", result.payload.data);
 * }
 * ```
 *
 * ## Error Handling
 * - Captures server-side validation errors
 * - Captures network issues (timeouts, connectivity failures)
 * - Falls back to a generic error message if none is provided
 *
 * @param payload - Bulk product creation input object.
 * @returns A Promise that resolves with `CreateProductResponse` on success,
 *          or rejects with a normalized error string via `rejectWithValue`.
 */
export const createProductsThunk = createAsyncThunk<
  CreateProductResponse,
  CreateProductBulkInput,
  { rejectValue: string }
>(
  'products/createProducts',
  async (payload, { rejectWithValue }) => {
    try {
      return await productService.createProducts(payload);
    } catch (err: any) {
      console.error('createProductsThunk error:', err);
      
      // Normalize backend / network error message
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create products.';
      
      return rejectWithValue(message);
    }
  }
);
