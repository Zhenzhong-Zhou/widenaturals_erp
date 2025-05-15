import { createAsyncThunk } from '@reduxjs/toolkit';
import type { FetchPricingParams, PaginatedPricingRecordsResponse } from '@features/pricing/state/pricingTypes.ts';
import { pricingService } from '@services/pricingService';
import type { PriceRequestParams, PriceResponse } from '@features/pricing';

/**
 * Async thunk to fetch paginated pricing records with filters, sorting, and keyword search.
 *
 * @param params - Object including page, limit, filters, sortBy, sortOrder, and keyword
 * @returns PaginatedPricingRecordsResponse
 */
export const fetchPricingListDataThunk = createAsyncThunk<
  PaginatedPricingRecordsResponse,        // Return type
  FetchPricingParams,                     // Parameter type
  { rejectValue: string }                 // Rejection error message type
>('pricing/fetchPricingData', async (params, { rejectWithValue }) => {
  try {
    return await pricingService.fetchPaginatedPricingRecords(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch pricing data');
  }
});

// /**
//  * Thunk to fetch pricing details by ID.
//  */
// export const getPricingDetailsThunk = createAsyncThunk<
//   PricingDetailsResponse, // Return type
//   { pricingId: string; page?: number; limit?: number }, // Payload type
//   { rejectValue: string } // Rejected value type
// >(
//   'pricing/getPricingDetails',
//   async ({ pricingId, page = 1, limit = 10 }, { rejectWithValue }) => {
//     try {
//       return await pricingService.fetchPricingDetails(pricingId, page, limit);
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data?.message || 'Failed to fetch pricing details'
//       );
//     }
//   }
// );

export const fetchPriceValueThunk = createAsyncThunk<
  PriceResponse,
  PriceRequestParams
>('pricing/fetchPriceValue', async (params, { rejectWithValue }) => {
  try {
    return await pricingService.fetchPriceByProductIdAndPriceTypeId(params);
  } catch (error: any) {
    console.error('Failed to fetch price:', error);
    return rejectWithValue(error.response?.data || 'Failed to fetch price');
  }
});
