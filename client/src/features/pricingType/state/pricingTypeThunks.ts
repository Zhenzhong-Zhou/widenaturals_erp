import { createAsyncThunk } from '@reduxjs/toolkit';
import { pricingTypeService } from '@services/pricingTypeService.ts';
import { dropdownService } from '@services/dropdownService.ts';
import type { PaginatedResponse } from 'types/api';
import type {
  FetchPricingTypesParams,
  PricingType,
  PricingTypeDropdownItem,
  PricingTypeResponse,
} from './pricingTypeTypes';

/**
 * Redux thunk to fetch paginated pricing types with optional filters.
 *
 * @param {FetchPricingTypesParams} params - Pagination and filter parameters.
 * @returns {PaginatedResponse<PricingType>} - A paginated list of pricing types.
 */
export const fetchAllPricingTypesThunk = createAsyncThunk<
  PaginatedResponse<PricingType>,
  FetchPricingTypesParams,
  { rejectValue: string }
>(
  'pricingTypes/fetchAllPricingTypes',
  async (params, thunkAPI) => {
    try {
      return await pricingTypeService.fetchAllPricingTypes(params);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || 'Failed to fetch pricing types'
      );
    }
  }
);

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
 * Thunk to fetch pricing types for a dropdown based on a product ID.
 */
export const fetchPricingTypeDropdownThunk = createAsyncThunk<
  PricingTypeDropdownItem[], // Expected response type
  string, // Accepts a productId as the argument
  { rejectValue: string } // Rejection error type
>(
  'pricingType/fetchPricingTypeDropdown',
  async (productId, { rejectWithValue }) => {
    // Accepts productId
    try {
      if (!productId) {
        return rejectWithValue(
          'Product ID is required to fetch pricing types.'
        );
      }

      // Call the service function with productId
      return await dropdownService.fetchPricingTypeDropdown(productId);
    } catch (error) {
      console.error('Error fetching pricing type dropdown:', error);
      return rejectWithValue('Failed to fetch pricing type dropdown.');
    }
  }
);
