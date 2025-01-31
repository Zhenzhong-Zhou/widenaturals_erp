import { createAsyncThunk } from '@reduxjs/toolkit';
import { PricingDetailsResponse, PricingResponse } from './pricingTypes.ts';
import { pricingService } from '../../../services';

/**
 * Async thunk to fetch paginated pricing records.
 */
export const fetchPricingData = createAsyncThunk<
  PricingResponse,  // Return type
  { page: number; limit: number },  // Argument type
  { rejectValue: string }  // Error type
>(
  'pricing/fetchPricingData',
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await pricingService.fetchAllPricings(page, limit);
      return response;
    } catch (error) {
      return rejectWithValue('Failed to fetch pricing data');
    }
  }
);

/**
 * Thunk to fetch pricing details by ID.
 */
export const getPricingDetails = createAsyncThunk<
  PricingDetailsResponse, // Return type
  { pricingId: string; page?: number; limit?: number }, // Payload type
  { rejectValue: string } // Rejected value type
>(
  'pricing/getPricingDetails',
  async ({ pricingId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      return await pricingService.fetchPricingDetails(pricingId, page, limit);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pricing details');
    }
  }
);
