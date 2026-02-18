import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  PackagingMaterialBatchQueryParams,
  PackagingMaterialBatchListUiResponse,
} from '@features/packagingMaterialBatch';
import { packagingMaterialBatchService } from '@services/packagingMaterialBatchService';
import { flattenPackagingMaterialBatchRecords } from '@features/packagingMaterialBatch/utils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetch a paginated list of packaging material batch records.
 *
 * Responsibilities:
 * - Delegates fetching to the service layer
 * - Supports pagination, sorting, and filtering
 * - Transforms domain-level records into flattened UI rows
 * - Preserves backend pagination metadata
 * - Normalizes API errors into UI-safe payload
 *
 * Concurrency:
 * - Safe for concurrent dispatches
 * - Managed by Redux Toolkit request lifecycle
 *
 * @param params Pagination, sorting, and filter options
 * @returns Paginated packaging material batch response with flattened rows
 */
export const fetchPaginatedPackagingMaterialBatchThunk = createAsyncThunk<
  PackagingMaterialBatchListUiResponse,
  PackagingMaterialBatchQueryParams,
  { rejectValue: { message: string; traceId?: string } }
>(
  'packagingMaterialBatch/fetchPaginatedPackagingMaterialBatch',
  async (params, { rejectWithValue }) => {
    try {
      const response =
        await packagingMaterialBatchService.fetchPaginatedPackagingMaterialBatches(
          params
        );
      
      return {
        ...response,
        data: flattenPackagingMaterialBatchRecords(response.data),
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
