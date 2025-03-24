import { createAsyncThunk } from '@reduxjs/toolkit';
import { PriceRequestParams, PriceResponse, PricingDetailsResponse, PricingResponse } from './pricingTypes.ts';
import { pricingService } from '../../../services';

/**
 * Async thunk to fetch paginated pricing records.
 */
export const fetchPricingDataThunk = createAsyncThunk<
  PricingResponse, // Return type
  { page: number; limit: number }, // Argument type
  { rejectValue: string } // Error type
>('pricing/fetchPricingData', async ({ page, limit }, { rejectWithValue }) => {
  try {
    return await pricingService.fetchAllPricings(page, limit);
  } catch (error) {
    return rejectWithValue('Failed to fetch pricing data');
  }
});

/**
 * Thunk to fetch pricing details by ID.
 */
export const getPricingDetailsThunk = createAsyncThunk<
  PricingDetailsResponse, // Return type
  { pricingId: string; page?: number; limit?: number }, // Payload type
  { rejectValue: string } // Rejected value type
>(
  'pricing/getPricingDetails',
  async ({ pricingId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      return await pricingService.fetchPricingDetails(pricingId, page, limit);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch pricing details'
      );
    }
  }
);

export const fetchPriceValueThunk = createAsyncThunk<
  PriceResponse,
  PriceRequestParams
>(
  'pricing/fetchPriceValue',
  async (params, { rejectWithValue }) => {
    try {
      return await pricingService.fetchPriceByProductIdAndPriceTypeId(params);
    } catch (error: any) {
      console.error("Failed to fetch price:", error);
      return rejectWithValue(error.response?.data || 'Failed to fetch price');
    }
  }
);
