import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  FetchPricingParams,
  PaginatedPricingDetailsResponse,
  PaginatedPricingRecordsResponse,
} from '@features/pricing/state/pricingTypes';
import { pricingService } from '@services/pricingService';

/**
 * Async thunk to fetch paginated pricing records with filters, sorting, and keyword search.
 *
 * @param params - Object including page, limit, filters, sortBy, sortOrder, and keyword
 * @returns PaginatedPricingRecordsResponse
 */
export const fetchPricingListDataThunk = createAsyncThunk<
  PaginatedPricingRecordsResponse, // Return type
  FetchPricingParams, // Parameter type
  { rejectValue: string } // Rejection error message type
>('pricing/fetchPricingData', async (params, { rejectWithValue }) => {
  try {
    return await pricingService.fetchPaginatedPricingRecords(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch pricing data');
  }
});

/**
 * Thunk to fetch paginated pricing details by pricing type ID.
 *
 * Dispatches a request to retrieve enriched pricing records associated with a specific pricing type,
 * including product, SKU, location, and audit metadata. Support pagination.
 *
 * Used for detailed views of pricing configurations under a given pricing type.
 *
 * @example
 * dispatch(getPricingDetailsByTypeThunk({ pricingTypeId: 'uuid', page: 1, limit: 10 }));
 */
export const fetchPricingDetailsByTypeThunk = createAsyncThunk<
  PaginatedPricingDetailsResponse, // Return type
  { pricingTypeId: string; page?: number; limit?: number }, // Payload
  { rejectValue: string } // Error
>(
  'pricing/getPricingDetailsByType',
  async ({ pricingTypeId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      return await pricingService.fetchPricingDetailsByType(
        pricingTypeId,
        page,
        limit
      );
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || 'Unable to fetch pricing details'
      );
    }
  }
);
