import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  ProductBatchQueryParams,
  PaginatedProductBatchListResponse,
} from '@features/productBatch';
import { productBatchService } from '@services/productBatchService';
import { flattenProductBatchRecords } from '@features/productBatch/utils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetches a paginated list of product batch records
 * and converts API records into UI-ready rows.
 *
 * Responsibilities:
 * - Calls productBatchService.fetchPaginatedProductBatches
 * - Flattens domain batch models before entering Redux state
 * - Preserves pagination metadata from the backend
 *
 * Transformation Boundary:
 * - Raw batch models → flattenProductBatchRecords → UI models
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 * - Errors are normalized via `extractUiErrorPayload`
 *
 * @param params - Pagination, sorting, and filtering options
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
