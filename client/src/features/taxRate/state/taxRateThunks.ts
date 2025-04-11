import { createAsyncThunk } from '@reduxjs/toolkit';
import { dropdownService } from '../../../services';
import type { TaxRateDropdownItem } from './taxRateTypes';

/**
 * Thunk to fetch tax rates for a dropdown.
 * Supports filtering by region and province.
 */
export const fetchTaxRateDropdownThunk = createAsyncThunk<
  TaxRateDropdownItem[], // Return type of the fulfilled action
  { region?: string; province?: string | null }, // Arguments passed to the thunk
  { rejectValue: string } // Type for rejected action
>(
  'taxRate/fetchTaxRates',
  async ({ region = 'Canada', province = null }, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchTaxRatesForDropdown(region, province); // Successfully fetches and returns the data
    } catch (error) {
      console.error('Error fetching tax rates for dropdown:', error);
      return rejectWithValue('Failed to fetch tax rates.');
    }
  }
);
