import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  PaginatedSkuProductCardResponse,
  SkuProductCardFilters,
} from './productTypes.ts';
import { skuService } from '@services/skuService';

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
