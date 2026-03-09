import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  FlattenedLocationTypeDetails,
  GetLocationTypeDetailsUiResponse,
  LocationTypeListQueryParams,
  PaginatedLocationTypeListUiResponse,
} from '@features/locationType';
import { locationTypeService } from '@services/locationTypeService';
import {
  flattenLocationTypeDetails,
  flattenLocationTypeListRecord,
} from '@features/locationType/utils';
import { extractUiErrorPayload } from '@utils/error';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Redux async thunk to fetch a paginated list of location types.
 *
 * Responsibilities:
 * - Delegates data fetching to `locationTypeService.fetchPaginatedLocationTypes`
 * - Supports pagination, sorting, and filtering
 * - Transforms domain-level LocationType records into flattened, UI-ready structures
 * - Preserves backend pagination metadata
 *
 * Design Principles:
 * - Contains no domain or business logic
 * - Performs transformation strictly at the API boundary
 * - Ensures Redux state stores only flattened UI models
 *
 * Error Handling:
 * - Rejects with a structured {@link UiErrorPayload}
 * - Errors normalized via `extractUiErrorPayload`
 * - Guarantees consistent reducer-level error handling
 *
 * Concurrency:
 * - Safe for concurrent dispatches; lifecycle managed by Redux Toolkit
 *
 * @param params - Pagination, sorting, and filter configuration
 * @returns Fulfilled action containing {@link PaginatedLocationTypeListUiResponse}
 *          with flattened records.
 */
export const fetchPaginatedLocationTypeThunk = createAsyncThunk<
  PaginatedLocationTypeListUiResponse,
  LocationTypeListQueryParams,
  { rejectValue: UiErrorPayload }
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
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Redux async thunk to fetch details for a single Location Type.
 *
 * Responsibilities:
 * - Calls `locationTypeService.fetchLocationTypeDetailsById`
 * - Transforms the nested domain model into a flattened UI-ready structure
 * - Returns a UI-safe response envelope
 *
 * Data Flow:
 * Service (domain model)
 *      ↓
 * flattenLocationTypeDetails (UI transformation)
 *      ↓
 * UI-ready response stored in Redux
 *
 * Design Principles:
 * - Clear separation between service layer (domain) and UI layer (flattened model)
 * - Thunk acts strictly as an API boundary adapter
 * - Redux state never stores raw domain entities
 *
 * Error Handling:
 * - Rejects with structured {@link UiErrorPayload}
 * - Errors normalized via `extractUiErrorPayload`
 * - Ensures predictable and consistent Redux error behavior
 *
 * @param locationTypeId - UUID of the Location Type
 * @returns Fulfilled action containing {@link GetLocationTypeDetailsUiResponse}
 */
export const fetchLocationTypeDetailsThunk = createAsyncThunk<
  GetLocationTypeDetailsUiResponse,
  string,
  { rejectValue: UiErrorPayload }
>('locationType/fetchDetails', async (locationTypeId, { rejectWithValue }) => {
  try {
    const response =
      await locationTypeService.fetchLocationTypeDetailsById(locationTypeId);

    const flattened: FlattenedLocationTypeDetails = flattenLocationTypeDetails(
      response.data
    );

    return {
      ...response,
      data: flattened,
    };
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});
