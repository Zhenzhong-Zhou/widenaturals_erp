import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  GetSkuDetailResponse,
  GetSkuProductCardsResponse,
  SkuProductCardQueryParams,
} from '@features/sku/state/skuTypes';
import { skuService } from '@services/skuService';

/**
 * Thunk: Fetch paginated SKU product cards.
 *
 * Wraps the API helper `fetchPaginatedSkuProductCards` and exposes it
 * to Redux Toolkits async lifecycle (`pending` → `fulfilled` → `rejected`).
 *
 * @param params - Pagination, sorting, and filter parameters
 * @returns A paginated list of SKU product cards + metadata
 *
 * @example
 * dispatch(fetchPaginatedSkuProductCardsThunk({
 *   page: 1,
 *   limit: 20,
 *   sortBy: "productName",
 *   sortOrder: "ASC",
 *   filters: { keyword: "immune" },
 * }));
 */
export const fetchPaginatedSkuProductCardsThunk = createAsyncThunk<
  GetSkuProductCardsResponse,
  SkuProductCardQueryParams | undefined
>(
  'skus/fetchPaginatedProductCards',
  async (params, { rejectWithValue }) => {
    try {
      return await skuService.fetchPaginatedSkuProductCards(params); // Full typed API envelope
    } catch (error: any) {
      console.error('Thunk error: failed to fetch SKU product cards', error);
      
      return rejectWithValue(
        error?.response?.data || {
          message: 'Failed to fetch SKU product cards',
          raw: error,
        }
      );
    }
  }
);

/**
 * Thunk for fetching a single SKU's detail record by ID.
 *
 * Wraps the service function `fetchSkuDetailById` and returns:
 * - `fulfilled` with `ApiSuccessResponse<SkuDetail>`
 * - `rejected` with `{ message, traceId }` on failure
 *
 * @param skuId - The UUID of the SKU to fetch.
 */
export const getSkuDetailByIdThunk = createAsyncThunk<
  GetSkuDetailResponse,
  string,
  { rejectValue: string }
>(
  'skus/getSkuDetailById',
  async (skuId, { rejectWithValue }) => {
    try {
      return await skuService.fetchSkuDetailById(skuId);
    } catch (err: any) {
      console.error('Thunk: Failed to fetch SKU detail', err);
      
      // Normalize error shape for rejectWithValue
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch SKU detail' ||
        err?.response?.data?.traceId || 'unknown';
      
      return rejectWithValue(message);
    }
  }
);
