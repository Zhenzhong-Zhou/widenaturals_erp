import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  ProductBatchQueryParams,
  PaginatedProductBatchListResponse,
} from '@features/productBatch';
import { productBatchService } from '@services/productBatchService';
import { flattenProductBatchRecords } from '@features/productBatch/utils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetch a paginated list of product batch records from the backend.
 *
 * Responsibilities:
 * - Delegates data fetching to the product batch service layer
 * - Supports pagination, sorting, and filtering
 * - Transforms domain-level product batch records into
 *   flattened, UI-ready structures
 * - Preserves backend pagination metadata without transformation
 * - Normalizes API errors into a structured UI-safe payload
 *   containing `message` and optional `traceId`
 *
 * Concurrency:
 * - Safe for concurrent dispatches; request lifecycle is managed
 *   by Redux Toolkit.
 *
 * @param params - Pagination, sorting, and product batch filters
 * @returns A paginated product batch response with flattened records
 */
export const fetchPaginatedProductBatchThunk = createAsyncThunk<
  PaginatedProductBatchListResponse,
  ProductBatchQueryParams,
  { rejectValue: { message: string; traceId?: string } }
>(
  'productBatch/fetchPaginatedProductBatch',
  async (params, { rejectWithValue }) => {
    try {
      const response =
        await productBatchService.fetchPaginatedProductBatches(params);

      return {
        ...response,
        data: flattenProductBatchRecords(response.data),
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
