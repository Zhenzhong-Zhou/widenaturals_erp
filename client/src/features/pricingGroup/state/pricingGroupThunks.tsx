/**
 * @file pricingGroupThunks.ts
 * @description Async thunks for pricing group data fetching.
 * Covers paginated list queries.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  PaginatedPricingGroupApiResponse,
  PricingGroupQueryParams,
} from '@features/pricingGroup';
import { pricingGroupService } from '@services/pricingGroupService';
import { extractUiErrorPayload } from '@utils/error';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Fetch a paginated list of pricing groups with optional filters and sorting.
 */
export const fetchPaginatedPricingGroupsThunk = createAsyncThunk<
  PaginatedPricingGroupApiResponse,
  PricingGroupQueryParams,
{ rejectValue: UiErrorPayload }
>(
  'pricingGroup/fetchPaginatedPricingGroups',
    async (params, { rejectWithValue }) => {
      try {
        return await pricingGroupService.fetchPaginatedPricingGroups(params);
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);
