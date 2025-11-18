import { createAsyncThunk } from '@reduxjs/toolkit';
import type { GetSkuDetailResponse } from '@features/sku/state/skuTypes';
import { skuService } from '@services/skuService';

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
