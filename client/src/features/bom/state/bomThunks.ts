import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  BomDetailsResponse,
  BomMaterialSupplyDetailsResponse,
  FetchBomsParams,
  FetchPaginatedBomsResponse,
} from '@features/bom/state/bomTypes';
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

/**
 * Thunk to fetch detailed information for a specific BOM.
 *
 * Dispatches pending, fulfilled, and rejected actions automatically.
 *
 * @param bomId - The BOM ID to fetch details for.
 * @returns A Redux async thunk action that resolves with detailed BOM data.
 *
 * @example
 * dispatch(fetchBomDetailsThunk('61bb1f94-aeb2-4724-b9b8-35023b165fdd'));
 */
export const fetchBomDetailsThunk = createAsyncThunk<
  BomDetailsResponse,  // The resolved payload type
  string,                      // The argument type (bomId)
  { rejectValue: string }      // Optional reject type for better typing
>(
  'boms/fetchBomDetails',
  async (bomId, { rejectWithValue }) => {
    try {
      return await bomService.fetchBomDetails(bomId);
    } catch (error: any) {
      console.error('Failed to fetch BOM details:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load BOM details.';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk: Fetch material supply details for a specific BOM.
 *
 * Dispatches an async request to load detailed supplier, cost,
 * and batch breakdowns for all BOM items.
 *
 * Notes:
 * - Uses `bomService.fetchBomMaterialSupplyDetails(bomId)` to call the API.
 * - Returns full structured response with summary and detailed sections.
 * - Consumed by BOM Material Supply Details UI and cost analysis modules.
 *
 * @param bomId - The unique BOM identifier to fetch material supply details for.
 * @returns A fulfilled action with {@link BomMaterialSupplyDetailsResponse}.
 *
 * @example
 * dispatch(fetchBomMaterialSupplyDetailsThunk('cbbf2680-2730-4cb1-a38e-ce32f93609c1'));
 */
export const fetchBomMaterialSupplyDetailsThunk = createAsyncThunk<
  BomMaterialSupplyDetailsResponse,
  string
>(
  'bom/fetchBomMaterialSupplyDetails',
  async (bomId, { rejectWithValue }) => {
    try {
      return await bomService.fetchBomMaterialSupplyDetails(bomId);
    } catch (error: any) {
      console.error('Failed to fetch BOM Material Supply Details:', { bomId, error });
      return rejectWithValue(error.response?.data ?? error.message);
    }
  }
);
