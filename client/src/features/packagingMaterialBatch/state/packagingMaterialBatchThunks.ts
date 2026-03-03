import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  PackagingMaterialBatchQueryParams,
  PackagingMaterialBatchListUiResponse,
} from '@features/packagingMaterialBatch';
import { packagingMaterialBatchService } from '@services/packagingMaterialBatchService';
import { flattenPackagingMaterialBatchRecords } from '@features/packagingMaterialBatch/utils';
import { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetches a paginated list of packaging material batches
 * and converts API records into UI-ready rows.
 *
 * Responsibilities:
 * - Calls packagingMaterialBatchService.fetchPaginatedPackagingMaterialBatches
 * - Flattens domain models before entering Redux state
 * - Preserves pagination metadata from the backend
 *
 * Transformation Boundary:
 * - Raw batch models → flattenPackagingMaterialBatchRecords → UI models
 *
 * Error Model:
 * - All failures return `UiErrorPayload`
 * - Errors are normalized via `extractUiErrorPayload`
 *
 * @param params - Pagination, sorting, and filtering options
 */
export const fetchPaginatedPackagingMaterialBatchThunk = createAsyncThunk<
  PackagingMaterialBatchListUiResponse,
  PackagingMaterialBatchQueryParams,
  { rejectValue: UiErrorPayload }
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
    } catch (error: unknown) {
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);
