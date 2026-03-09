/**
 * ================================================================
 * Pricing Thunks Module
 * ================================================================
 *
 * Responsibility:
 * - Orchestrates pricing-related asynchronous workflows.
 * - Serves as the boundary between UI and pricingService.
 *
 * Scope:
 * - Fetch paginated pricing records
 * - Fetch pricing details by pricing type
 *
 * Architecture:
 * - Delegates API calls to pricingService
 * - No transformation performed at thunk level
 * - Redux state stores service response models directly
 *
 * Error Model:
 * - All failures return `UiErrorPayload`
 * - Errors are normalized via `extractUiErrorPayload`
 * ================================================================
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  FetchPricingParams,
  PaginatedPricingDetailsResponse,
  PaginatedPricingRecordsResponse,
} from '@features/pricing/state/pricingTypes';
import { pricingService } from '@services/pricingService';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Fetches a paginated list of pricing records.
 *
 * Responsibilities:
 * - Calls pricingService.fetchPaginatedPricingRecords
 * - Passes pagination, sorting, filtering, and keyword parameters
 * - Returns service response directly (no transformation)
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param params - Pagination, filtering, sorting, and search options
 */
export const fetchPricingListDataThunk = createAsyncThunk<
  PaginatedPricingRecordsResponse,
  FetchPricingParams,
  { rejectValue: UiErrorPayload }
>('pricing/fetchPricingData', async (params, { rejectWithValue }) => {
  try {
    return await pricingService.fetchPaginatedPricingRecords(params);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetches paginated pricing details for a specific pricing type.
 *
 * Responsibilities:
 * - Calls pricingService.fetchPricingDetailsByType
 * - Returns enriched pricing records associated with a pricing type
 * - Preserves pagination metadata
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param pricingTypeId - Pricing type UUID
 * @param page          - Page number (default: 1)
 * @param limit         - Page size (default: 10)
 */
export const fetchPricingDetailsByTypeThunk = createAsyncThunk<
  PaginatedPricingDetailsResponse,
  { pricingTypeId: string; page?: number; limit?: number },
  { rejectValue: UiErrorPayload }
>(
  'pricing/getPricingDetailsByType',
  async ({ pricingTypeId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      return await pricingService.fetchPricingDetailsByType(
        pricingTypeId,
        page,
        limit
      );
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
