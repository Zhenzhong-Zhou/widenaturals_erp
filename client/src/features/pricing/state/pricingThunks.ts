import { createAsyncThunk } from '@reduxjs/toolkit';
import { PricingResponse } from './pricingTypes.ts';
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
