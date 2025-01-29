import { createAsyncThunk } from '@reduxjs/toolkit';
import { authorizeService } from '../../../services';

export const fetchPermissionsThunk = createAsyncThunk<
  { roleName: string; permissions: string[] }, // Return type
  void,                                        // Argument type
  { rejectValue: string }                      // Reject value type
>('permissions/fetch', async (_, { rejectWithValue }) => {
  try {
     // Call the adjusted function
    return await authorizeService.fetchPermissions();
  } catch (error: any) {
    // Handle errors and return a meaningful error message
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions.');
  }
});