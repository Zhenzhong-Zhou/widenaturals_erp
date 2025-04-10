import { createAsyncThunk } from '@reduxjs/toolkit';
import { LocationResponse } from '@features/location';
import { locationService } from '@services/locationService';

/**
 * Async thunk to fetch all locations with pagination.
 */
export const fetchAllLocations = createAsyncThunk<
  LocationResponse, // Return type
  { page: number; limit: number }, // Params type
  { rejectValue: string } // Error type
>('locations/fetchAll', async ({ page, limit }, { rejectWithValue }) => {
  try {
    return await locationService.fetchAllLocations(page, limit);
  } catch (error) {
    return rejectWithValue('Failed to fetch locations');
  }
});
