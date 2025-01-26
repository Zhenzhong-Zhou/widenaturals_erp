import { createAsyncThunk } from '@reduxjs/toolkit';
import { authorizeService } from '../../../services';

export const fetchPermissionsThunk = createAsyncThunk<
  { roleName: string; permissions: string[] }, // Return type
  void,                                        // Argument type
  { rejectValue: string }                      // Reject value type
>('permissions/fetch', async (_, { rejectWithValue }) => {
  try {
    const result = await authorizeService.fetchPermissions(); // Call the adjusted function
    console.log(result);
    return result; // Already in the expected format
  } catch (error: any) {
    // Handle errors and return a meaningful error message
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions.');
  }
});