import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  FetchSkusParams,
  GetSkuDetailResponse,
  GetSkuListResponse,
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

/**
 * Redux Toolkit Thunk — Fetch paginated SKUs with full support for
 * pagination, sorting, and advanced filter options.
 *
 * This thunk issues a GET request to the SKU list endpoint:
 *
 *    GET /skus?page={page}&limit={limit}&sortBy={col}&sortOrder={order}&...
 *
 * The request parameters are normalized into a flat query string and passed
 * directly to the backend, which performs a server-side filtered and sorted
 * query. The response returns a standard paginated envelope:
 *
 *    {
 *      success: true,
 *      message: "...",
 *      data: SkuListItem[],
 *      pagination: {
 *        page,
 *        limit,
 *        totalRecords,
 *        totalPages
 *      }
 *    }
 *
 * The thunk populates the Redux `paginatedSkus` slice with:
 *   - `data`: array of SKU list items
 *   - `pagination`: updated paging metadata
 *   - `loading`: request status
 *   - `error`: error message, if any
 *
 * @param params - Query options for the SKU list request. Includes:
 *   - Pagination (page, limit)
 *   - Sorting (sortBy, sortOrder)
 *   - Filters (keyword, brand, category, dimensions, audit fields, etc.)
 *
 * @returns A promise resolving to the typed `GetSkuListResponse`.
 *
 * @throws {Error} Re-throws request exceptions (network/server/API errors).
 */
export const fetchPaginatedSkusThunk = createAsyncThunk<
  GetSkuListResponse,          // Return type
  FetchSkusParams,             // Argument type
  { rejectValue: string }      // Error payload
>(
  'skus/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      return await skuService.fetchPaginatedSkus(params);
    } catch (err: any) {
      console.error('fetchSkusThunk error:', err);
      
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch SKUs';
      
      return rejectWithValue(message);
    }
  }
);
