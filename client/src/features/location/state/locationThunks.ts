import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  LocationListQueryParams,
  PaginatedLocationListUiResponse,
} from '@features/location';
import { locationService } from '@services/locationService';
import { flattenLocationListRecord } from '@features/location/utils';
import { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Redux async thunk to fetch a paginated list of locations.
 *
 * Responsibilities:
 * - Delegates data fetching to `locationService.fetchPaginatedLocations`
 * - Supports pagination, sorting, and filtering
 * - Transforms domain-level Location records into flattened, UI-ready structures
 * - Preserves backend pagination metadata without modification
 *
 * Design Principles:
 * - Contains no domain or business logic
 * - Performs transformation strictly at the API boundary
 * - Ensures Redux state stores only flattened UI models
 *
 * Error Handling:
 * - Rejects with a structured {@link UiErrorPayload}
 * - All errors are normalized via `extractUiErrorPayload`
 * - Guarantees consistent UI-safe reducer behavior
 *
 * Concurrency:
 * - Safe for concurrent dispatches; lifecycle managed by Redux Toolkit
 *
 * @param params - Pagination, sorting, and location filter configuration
 * @returns A fulfilled action containing {@link PaginatedLocationListUiResponse}
 *          with flattened location records.
 */
export const fetchPaginatedLocationThunk = createAsyncThunk<
  PaginatedLocationListUiResponse,
  LocationListQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'location/fetchPaginatedLocation',
  async (params, { rejectWithValue }) => {
    try {
      const response = await locationService.fetchPaginatedLocations(params);
      
      return {
        ...response,
        data: flattenLocationListRecord(response.data),
      };
    } catch (error: unknown) {
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);
