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
  flattenLocationTypeListRecord
} from '@features/locationType/utils';
import { extractUiErrorPayload } from '@utils/error';
import { UiErrorPayload } from '@utils/error/uiErrorUtils';

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

/**
 * Fetch Location Type details by ID (Thunk).
 *
 * ─────────────────────────────────────────────────────────────
 * Purpose
 * ─────────────────────────────────────────────────────────────
 * Orchestrates the full detail retrieval flow for a single
 * Location Type entity.
 *
 * This thunk:
 * 1. Calls the API service layer
 * 2. Transforms the canonical domain model into a flattened
 *    UI-ready structure
 * 3. Returns a UI-safe response envelope
 *
 * ─────────────────────────────────────────────────────────────
 * Data Flow
 * ─────────────────────────────────────────────────────────────
 * Service (nested domain model)
 *        ↓
 * Transformer (flattenLocationTypeDetails)
 *        ↓
 * UI-ready ApiSuccessResponse<FlattenedLocationTypeDetails>
 *
 * The thunk intentionally separates:
 * - Domain modeling (service layer)
 * - UI transformation (transformer layer)
 * - Redux state management (slice layer)
 *
 * ─────────────────────────────────────────────────────────────
 * Error Handling
 * ─────────────────────────────────────────────────────────────
 * - Normalizes all runtime and transport errors into
 *   UiErrorPayload
 * - Preserves:
 *     • user-facing message
 *     • error classification
 *     • optional traceId for diagnostics
 * - Ensures rejectValue typing consistency
 *
 * This guarantees predictable Redux error handling.
 *
 * ─────────────────────────────────────────────────────────────
 * @param locationTypeId - UUID identifier of the Location Type
 *
 * @returns
 * Fulfilled:
 *   ApiSuccessResponse<FlattenedLocationTypeDetails>
 *
 * Rejected:
 *   UiErrorPayload
 */
export const fetchLocationTypeDetailsThunk = createAsyncThunk<
  GetLocationTypeDetailsUiResponse,
  string,
  { rejectValue: UiErrorPayload }
>(
  'locationType/fetchDetails',
  async (locationTypeId, { rejectWithValue }) => {
    try {
      const response =
        await locationTypeService.fetchLocationTypeDetailsById(
          locationTypeId
        );
      
      const flattened: FlattenedLocationTypeDetails =
        flattenLocationTypeDetails(response.data);
      
      return {
        ...response,
        data: flattened,
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
