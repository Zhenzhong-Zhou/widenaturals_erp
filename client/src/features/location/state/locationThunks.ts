import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  LocationListQueryParams,
  PaginatedLocationListUiResponse,
} from '@features/location';
import { locationService } from '@services/locationService';
import { flattenLocationListRecord } from '@features/location/utils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetch a paginated list of locations from the backend.
 *
 * Responsibilities:
 * - Delegates data fetching to the location service layer
 * - Supports pagination, sorting, and filtering
 * - Transforms domain-level LocationRecord objects into
 *   flattened UI-ready structures
 * - Preserves backend pagination metadata without modification
 * - Normalizes API errors into a structured UI-safe payload
 *   containing `message` and optional `traceId`
 *
 * Concurrency:
 * - Safe for concurrent dispatches; request lifecycle
 *   managed by Redux Toolkit
 *
 * @param params - Pagination, sorting, and location filters
 * @returns A paginated location response with flattened records
 */
export const fetchPaginatedLocationThunk = createAsyncThunk<
  PaginatedLocationListUiResponse,
  LocationListQueryParams,
  { rejectValue: { message: string; traceId?: string } }
>(
  'location/fetchPaginatedLocation',
  async (params, { rejectWithValue }) => {
    try {
      const response =
        await locationService.fetchPaginatedLocations(params);
      
      return {
        ...response,
        data: flattenLocationListRecord(response.data),
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
