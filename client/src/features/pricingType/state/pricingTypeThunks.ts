/**
 * @file pricingTypeThunks.ts
 * @description Async thunks for pricing type data fetching.
 * Covers paginated list queries and single record detail fetches.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  PaginatedPricingTypeApiResponse,
  PricingTypeDetailApiResponse,
  PricingTypeQueryParams,
} from '@features/pricingType';
import { pricingTypeService } from '@services/pricingTypeService';
import { extractUiErrorPayload } from '@utils/error';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Fetch a paginated list of pricing types with optional filters and sorting.
 */
export const fetchPaginatedPricingTypesThunk = createAsyncThunk<
  PaginatedPricingTypeApiResponse,
  PricingTypeQueryParams,
{ rejectValue: UiErrorPayload }
>(
  'pricingType/fetchPaginatedPricingTypes',
    async (params, { rejectWithValue }) => {
      try {
        return await pricingTypeService.fetchPaginatedPricingTypes(params);
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);

/**
 * Fetch full pricing type details by ID.
 */
export const fetchPricingTypeByIdThunk = createAsyncThunk<
  PricingTypeDetailApiResponse,
  string,
{ rejectValue: UiErrorPayload }
>(
  'pricingType/fetchPricingTypeById',
    async (pricingTypeId, { rejectWithValue }) => {
      try {
        return await pricingTypeService.fetchPricingTypeDetailsById(pricingTypeId);
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);
