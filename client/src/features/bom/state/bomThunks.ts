import { createAsyncThunk } from '@reduxjs/toolkit';
import type { FetchBomsParams, FetchPaginatedBomsResponse } from '@features/bom/state/bomTypes';
import { bomService } from '@services/bomService';

/**
 * Redux async thunk to fetch a paginated and filtered list of BOMs.
 *
 * This wraps `bomService.fetchPaginatedBoms` to handle:
 * - Pending/loading state
 * - Success with payload
 * - Rejection with error message
 *
 * @param params - Pagination, sorting, and filter parameters.
 *
 * @example
 * dispatch(fetchPaginatedBomsThunk({ page: 1, limit: 10, filters: { isActive: true } }));
 */
export const fetchPaginatedBomsThunk = createAsyncThunk<
  FetchPaginatedBomsResponse, // Return type
  FetchBomsParams,            // Argument type
  { rejectValue: string }     // Error payload type
>(
  'boms/fetchPaginatedBoms',
  async (params, { rejectWithValue }) => {
    try {
      return await bomService.fetchPaginatedBoms(params);
    } catch (error: any) {
      console.error('Thunk: Failed to fetch BOM list:', error);
      return rejectWithValue(
        error?.response?.data?.message || error?.message || 'Failed to fetch BOMs.'
      );
    }
  }
);
