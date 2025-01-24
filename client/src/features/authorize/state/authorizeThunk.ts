import { createAsyncThunk } from '@reduxjs/toolkit';
import { PermissionResponse } from './authorzeTypes.ts';
import { authorizeService } from '../../../services';

export const fetchPermissionsThunk = createAsyncThunk<
  string[], // Return type (permissions array)
  void,     // Argument type
  { rejectValue: string } // Reject value type
>('permissions/fetch', async (_, { rejectWithValue }) => {
  try {
    const response: PermissionResponse = await authorizeService.fetchPermissions();
    if (response.success) {
      return response.data;
    } else {
      return rejectWithValue('Failed to retrieve permissions.');
    }
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch permissions.');
  }
});