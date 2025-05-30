import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  GetBatchRegistryDropdownParams,
  GetBatchRegistryDropdownResponse,
} from '@features/dropdown/state/dropdownTypes';
import { dropdownService } from '@services/dropdownService';

/**
 * Thunk to fetch batch registry items for dropdown use.
 *
 * This thunk supports optional filtering and pagination via query parameters.
 *
 * @param params - Optional query filters such as batch type, limit, offset, or exclusions.
 * @returns A fulfilled action with dropdown items or a rejected action with an error message.
 */
export const fetchBatchRegistryDropdownThunk = createAsyncThunk<
  GetBatchRegistryDropdownResponse, // Return type on success
  GetBatchRegistryDropdownParams,  // Argument type
  { rejectValue: string }          // Rejection payload type
>(
  'dropdown/fetchBatchRegistryDropdown',
  async (params, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchBatchRegistryDropdown(params);
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch dropdown items');
    }
  }
);
