/**
 * @file pricingThunks.ts
 * @description Async thunks for pricing join list data fetching and export.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  PaginatedPricingListUiResponse,
  PricingQueryParams,
  PricingExportQueryParams,
} from '@features/pricing';
import { pricingService } from '@services/pricingService';
import { extractUiErrorPayload } from '@utils/error';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { buildExportFileSuffix, flattenPricingJoinRecords } from '@features/pricing/utils';

/**
 * Fetch a paginated list of joined pricing records with optional filters and sorting.
 */
export const fetchPaginatedPricingThunk = createAsyncThunk<
  PaginatedPricingListUiResponse,
  PricingQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'pricing/fetchPaginatedPricing',
    async (params, { rejectWithValue }) => {
      try {
        const response = await pricingService.fetchPaginatedPricing(params);
        return {
          ...response,
          data: flattenPricingJoinRecords(response.data),
        };
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);

/**
 * Download a pricing export file in the requested format.
 */
export const exportPricingThunk = createAsyncThunk<
  void,
  PricingExportQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'pricing/exportPricing',
  async (params, { rejectWithValue }) => {
    try {
      const blob = await pricingService.exportPricing(params);
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
      ].join('-');
      const suffix = buildExportFileSuffix(params.filters ?? {});
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricing_export${suffix}_${timestamp}.${params.exportFormat ?? 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
