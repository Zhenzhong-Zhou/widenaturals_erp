import { createAsyncThunk } from '@reduxjs/toolkit';
import { LocationTypesResponse } from './locationTypeTypes.ts';
import { locationTypeService } from '../../../services';

/**
 * Async thunk for fetching location types with pagination.
 */
export const fetchLocationTypes = createAsyncThunk<
  LocationTypesResponse, // Return type
  { page: number; limit: number }, // Argument type
  { rejectValue: string } // Error type
>(
  'locationTypes/fetchAll',
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      return await locationTypeService.fetchAllLocationTypes(page, limit); // Pass page & limit
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch location types'); // Dynamic error message
    }
  }
);
