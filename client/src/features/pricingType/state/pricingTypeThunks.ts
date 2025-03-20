import { createAsyncThunk } from '@reduxjs/toolkit';
import { dropdownService, pricingTypeService } from '../../../services';
import { PricingTypeDropdownItem, PricingTypeResponse, PricingTypesResponse } from './pricingTypeTypes';

export const fetchPricingTypesThunk = createAsyncThunk<
  PricingTypesResponse,
  { page: number; limit: number },
  { rejectValue: string }
>('pricingTypes/fetchPricingTypes', async ({ page, limit }, thunkAPI) => {
  try {
    return await pricingTypeService.fetchAllPricingTypes(page, limit);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.message || 'Failed to fetch pricing types'
    );
  }
});

export const fetchPricingTypeDetailsThunk = createAsyncThunk<
  PricingTypeResponse,
  { pricingTypeId: string; page: number; limit: number },
  { rejectValue: string }
>(
  'pricingTypes/fetchPricingTypeDetails',
  async ({ pricingTypeId, page, limit }, thunkAPI) => {
    try {
      return await pricingTypeService.fetchPricingTypeDetailsById(
        pricingTypeId,
        page,
        limit
      );
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || 'Failed to fetch pricing type details'
      );
    }
  }
);

/**
 * Thunk to fetch pricing types for a dropdown.
 */
export const fetchPricingTypeDropdownThunk = createAsyncThunk<
  PricingTypeDropdownItem[], // Expected response type
  void,                      // No parameters required
  { rejectValue: string }     // Rejection error type
>(
  'pricingType/fetchPricingTypeDropdown',
  async (_, { rejectWithValue }) => {
    try {
       // Call the service function
      return await dropdownService.fetchPricingTypeDropdown();
    } catch (error) {
      console.error('Error fetching pricing type dropdown:', error);
      return rejectWithValue('Failed to fetch pricing type dropdown.');
    }
  }
);