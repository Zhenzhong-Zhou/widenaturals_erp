import { createAsyncThunk } from '@reduxjs/toolkit';
import { pricingTypeService } from '@services/pricingTypeService.ts';
import { dropdownService } from '@services/dropdownService.ts';
import type { PaginatedResponse } from '@shared-types/api';
import type {
  FetchPricingTypesParams,
  PricingType,
  PricingTypeDropdownItem,
  PricingTypeMetadata,
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
>('pricingTypes/fetchAllPricingTypes', async (params, thunkAPI) => {
  try {
    return await pricingTypeService.fetchAllPricingTypes(params);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.message || 'Failed to fetch pricing types'
    );
  }
});

/**
 * Thunk to fetch pricing type metadata by ID.
 *
 * This thunk calls the pricing type service to retrieve metadata such as
 * name, code, status, and audit fields (createdBy, updatedBy). It handles
 * success and error states for use in Redux state management.
 *
 * @param {string} id - The UUID of the pricing type to fetch.
 * @returns {Promise<PricingTypeMetadata>} On success, returns the transformed pricing type metadata.
 * @throws {string} On failure, returns a rejected value containing the error message.
 *
 * @example
 * dispatch(fetchPricingTypeMetadataThunk('d421a039-...'));
 */
export const fetchPricingTypeMetadataThunk = createAsyncThunk<
  PricingTypeMetadata,
  string,
  { rejectValue: string }
>('pricingType/fetchMetadataById', async (id, { rejectWithValue }) => {
  try {
    const response = await pricingTypeService.fetchPricingTypeMetadataById(id);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.message || 'Failed to fetch pricing type metadata'
    );
  }
});

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
