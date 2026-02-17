import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  LocationTypeListQueryParams,
  PaginatedLocationTypeListUiResponse,
} from '@features/locationType';
import { locationTypeService } from '@services/locationTypeService';
import { flattenLocationTypeListRecord } from '@features/locationType/utils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetch a paginated list of location types from the backend.
 *
 * Responsibilities:
 * - Delegates data fetching to the location type service layer
 * - Supports pagination, sorting, and filtering
 * - Transforms domain-level LocationTypeRecord objects into
 *   flattened UI-ready structures
 * - Preserves backend pagination metadata without modification
 * - Normalizes API errors into a structured UI-safe payload
 *   containing `message` and optional `traceId`
 *
 * Concurrency:
 * - Safe for concurrent dispatches; request lifecycle
 *   managed by Redux Toolkit
 *
 * @param params - Pagination, sorting, and location type filters
 * @returns A paginated location type response with flattened records
 */
export const fetchPaginatedLocationTypeThunk = createAsyncThunk<
  PaginatedLocationTypeListUiResponse,
  LocationTypeListQueryParams,
  { rejectValue: { message: string; traceId?: string } }
>(
  'locationType/fetchPaginatedLocationType',
  async (params, { rejectWithValue }) => {
    try {
      const response =
        await locationTypeService.fetchPaginatedLocationTypes(params);
      
      return {
        ...response,
        data: flattenLocationTypeListRecord(response.data),
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
