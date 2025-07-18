import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  PaginatedSkuProductCardResponse,
  SkuDetails,
  SkuProductCardFilters,
} from './skuTypes';
import { skuService } from '@services/skuService';
import { AxiosError } from 'axios';

/**
 * Thunk to fetch a paginated list of active SKU product cards.
 * Sends optional filters and pagination details to the backend.
 *
 * @param {Object} params - Query parameters.
 * @param {number} params.page - Current page (default: 1).
 * @param {number} params.limit - Items per page (default: 10).
 * @param {SkuProductCardFilters} [params.filters] - Optional filters for brand, category, region, etc.
 *
 * @returns {Promise<PaginatedSkuProductCardResponse>} Response including product card data and pagination metadata.
 */
export const fetchSkuProductCardsThunk = createAsyncThunk<
  PaginatedSkuProductCardResponse,
  {
    page?: number;
    limit?: number;
    filters?: SkuProductCardFilters;
  }
>(
  'sku/fetchProductCards',
  async ({ page = 1, limit = 10, filters = {} }, thunkAPI) => {
    try {
      return await skuService.fetchActiveSkuProductCards(page, limit, filters);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

/**
 * Thunk to fetch detailed SKU information for the given SKU ID.
 *
 * Dispatches loading, success, or failure state.
 *
 * @param skuId - The UUID of the SKU to fetch
 * @returns SkuDetails on success or a string error message on failure
 */
export const fetchSkuDetailsThunk = createAsyncThunk<
  SkuDetails, // Return type
  string, // Argument: skuId
  {
    rejectValue: string; // Custom error message
  }
>('sku/fetchSkuDetails', async (skuId, { rejectWithValue }) => {
  try {
    const response = await skuService.getSkuDetails(skuId);
    return response.data; // Extract just the SkuDetail
  } catch (error) {
    let message = 'Failed to fetch SKU details.';

    if (error instanceof AxiosError && error.response?.data?.message) {
      message = error.response.data.message;
    }

    console.error('[Thunk] fetchSkuDetailsThunk failed:', {
      skuId,
      error: error instanceof Error ? error.message : String(error),
    });

    return rejectWithValue(message);
  }
});
