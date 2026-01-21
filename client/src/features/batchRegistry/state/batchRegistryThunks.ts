import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  BatchRegistryQueryParams,
  PaginatedBatchRegistryListResponse
} from '@features/batchRegistry';
import { batchRegistryService } from '@services/batchRegistryService';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetch a paginated list of batch registry records from the backend.
 *
 * Responsibilities:
 * - Delegates data fetching to the batch registry service layer
 * - Supports pagination, sorting, and filtering
 * - Preserves backend pagination metadata without transformation
 * - Normalizes API errors into a structured UI-safe payload
 *   containing `message` and optional `traceId`
 *
 * Concurrency:
 * - Safe for concurrent dispatches; request lifecycle is managed
 *   by Redux Toolkit.
 *
 * @param params - Pagination, sorting, and batch registry filters
 * @returns A paginated batch registry response
 */
export const fetchPaginatedBatchRegistryThunk = createAsyncThunk<
  PaginatedBatchRegistryListResponse,
  BatchRegistryQueryParams,
  { rejectValue: { message: string; traceId?: string } }
>(
  'batchRegistry/fetchPaginatedBatchRegistry',
  async (params, { rejectWithValue }) => {
    try {
      return await batchRegistryService.fetchPaginatedBatchRegistry(
        params
      );
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
