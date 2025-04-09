import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  LocationTypeResponse,
  LocationTypesResponse,
} from './locationTypeTypes.ts';
import { locationTypeService } from '../../../services';

/**
 * Async thunk for fetching location types with pagination.
 */
export const fetchLocationTypesThunk = createAsyncThunk<
  LocationTypesResponse, // Return type
  { page: number; limit: number }, // Argument type
  { rejectValue: string } // Error type
>('locationTypes/fetchAll', async ({ page, limit }, { rejectWithValue }) => {
  try {
    return await locationTypeService.fetchAllLocationTypes(page, limit); // Pass page & limit
  } catch (error: any) {
    return rejectWithValue(error?.message || 'Failed to fetch location types'); // Dynamic error message
  }
});

/**
 * Thunk to fetch location type details by ID.
 */
export const fetchLocationTypeDetailsThunk = createAsyncThunk<
  LocationTypeResponse, // Return type
  {
    id: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }, // Arguments type
  { rejectValue: string } // Error type
>(
  'locationType/fetchDetail',
  async ({ id, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      return await locationTypeService.fetchLocationTypeDetailById(
        id,
        page,
        limit
      );
    } catch (error) {
      return rejectWithValue('Failed to fetch location type details');
    }
  }
);
