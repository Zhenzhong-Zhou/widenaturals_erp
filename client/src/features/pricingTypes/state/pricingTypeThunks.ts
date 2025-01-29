import { createAsyncThunk } from '@reduxjs/toolkit';
import { pricingTypeService } from '../../../services';
import { PricingTypesResponse } from './pricingTypeTypes';

export const fetchPricingTypesThunk = createAsyncThunk<
  PricingTypesResponse,
  { page: number; rowsPerPage: number },
  { rejectValue: string }
>('pricingTypes/fetchPricingTypes', async ({ page, rowsPerPage }, thunkAPI) => {
  try {
    const response = await pricingTypeService.fetchAllPricingTypes(page, rowsPerPage);
    return response;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch pricing types');
  }
});
