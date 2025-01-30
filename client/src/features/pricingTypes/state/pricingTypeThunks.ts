import { createAsyncThunk } from '@reduxjs/toolkit';
import { pricingTypeService } from '../../../services';
import { PricingTypeResponse, PricingTypesResponse } from './pricingTypeTypes';

export const fetchPricingTypesThunk = createAsyncThunk<
  PricingTypesResponse,
  { page: number; limit: number },
  { rejectValue: string }
>('pricingTypes/fetchPricingTypes', async ({ page, limit }, thunkAPI) => {
  try {
    return await pricingTypeService.fetchAllPricingTypes(page, limit);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch pricing types');
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
      const response = await pricingTypeService.fetchPricingTypeDetailsById(pricingTypeId, page, limit);
      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to fetch pricing type details');
    }
  }
);