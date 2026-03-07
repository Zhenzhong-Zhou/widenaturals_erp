/**
 * ================================================================
 * Pricing Type Thunks Module
 * ================================================================
 *
 * Responsibility:
 * - Orchestrates asynchronous pricing type workflows.
 * - Serves as the boundary between UI and pricingTypeService.
 *
 * Scope:
 * - Fetch paginated pricing type records
 * - Fetch pricing type metadata by ID
 *
 * Architecture:
 * - Delegates API calls to pricingTypeService
 * - No transformation is performed at the thunk layer
 * - Redux state stores service response models directly
 *
 * Error Model:
 * - All failures return `UiErrorPayload`
 * - Errors are normalized via `extractUiErrorPayload`
 * ================================================================
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { pricingTypeService } from '@services/pricingTypeService';
import type { PaginatedResponse } from '@shared-types/api';
import type {
  FetchPricingTypesParams,
  PricingType,
  PricingTypeMetadata,
} from './pricingTypeTypes';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Fetches a paginated list of pricing types.
 *
 * Responsibilities:
 * - Calls pricingTypeService.fetchAllPricingTypes
 * - Passes pagination and filter parameters
 * - Returns service response directly without transformation
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param params - Pagination and filtering options
 */
export const fetchAllPricingTypesThunk = createAsyncThunk<
  PaginatedResponse<PricingType>,
  FetchPricingTypesParams,
  { rejectValue: UiErrorPayload }
>('pricingTypes/fetchAllPricingTypes', async (params, { rejectWithValue }) => {
  try {
    return await pricingTypeService.fetchAllPricingTypes(params);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetches metadata for a single pricing type.
 *
 * Responsibilities:
 * - Calls pricingTypeService.fetchPricingTypeMetadataById
 * - Returns pricing type metadata for detail views
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param id - Pricing type UUID
 */
export const fetchPricingTypeMetadataThunk = createAsyncThunk<
  PricingTypeMetadata,
  string,
  { rejectValue: UiErrorPayload }
>('pricingType/fetchMetadataById', async (id, { rejectWithValue }) => {
  try {
    const response = await pricingTypeService.fetchPricingTypeMetadataById(id);

    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});
