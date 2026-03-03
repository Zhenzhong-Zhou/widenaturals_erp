import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  BatchRegistryQueryParams,
  PaginatedBatchRegistryListResponse,
} from '@features/batchRegistry';
import { batchRegistryService } from '@services/batchRegistryService';
import { flattenBatchRegistryRecords } from '@features/batchRegistry/utils';
import { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetch a paginated list of batch registry records from the backend.
 *
 * Responsibilities:
 * - Delegates data fetching to the batch registry service layer
 * - Supports pagination, sorting, and filtering
 * - Transforms domain-level batch registry records into
 *   flattened, UI-ready structures
 * - Preserves backend pagination metadata without transformation
 * - Normalizes API errors into a structured UI-safe payload
 *   containing `message` and optional `traceId`
 *
 * Concurrency:
 * - Safe for concurrent dispatches; request lifecycle is managed
 *   by Redux Toolkit.
 *
 * @param params - Pagination, sorting, and batch registry filters
 * @returns A paginated batch registry response with flattened records
 */
export const fetchPaginatedBatchRegistryThunk = createAsyncThunk<
  PaginatedBatchRegistryListResponse,
  BatchRegistryQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'batchRegistry/fetchPaginatedBatchRegistry',
  async (params, { rejectWithValue }) => {
    try {
      const response =
        await batchRegistryService.fetchPaginatedBatchRegistry(params);
      
      return {
        ...response,
        data: flattenBatchRegistryRecords(response.data),
      };
    } catch (error: unknown) {
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);
