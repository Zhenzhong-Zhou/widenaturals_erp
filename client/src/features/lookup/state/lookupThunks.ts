import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  GetBatchRegistryLookupParams,
  GetBatchRegistryLookupResponse,
  GetWarehouseLookupFilters,
  GetWarehouseLookupResponse,
  LotAdjustmentTypeLookupResponse,
} from '@features/lookup/state/lookupTypes';
import { lookupService } from '@services/lookupService';

/**
 * Thunk to fetch batch registry items for lookup use.
 *
 * This thunk supports optional filtering and pagination via query parameters.
 *
 * @param params - Optional query filters such as batch type, limit, offset, or exclusions.
 * @returns A fulfilled action with lookup items or a rejected action with an error message.
 */
export const fetchBatchRegistryLookupThunk = createAsyncThunk<
  GetBatchRegistryLookupResponse, // Return type on success
  GetBatchRegistryLookupParams, // Argument type
  { rejectValue: string } // Rejection payload type
>(
  'lookup/fetchBatchRegistryLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchBatchRegistryLookup(params);
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || 'Failed to fetch lookup items'
      );
    }
  }
);

/**
 * Async thunk to fetch warehouse lookup options.
 *
 * Fetches a list of active or filtered warehouses for use in lookup menus.
 * Supports optional filters such as location type and warehouse type.
 *
 * @param {GetWarehouseLookupFilters} [filters] - Optional filter parameters
 * @returns {Promise<GetWarehouseLookupResponse>} - API response with lookup items
 */
export const fetchWarehouseLookupThunk = createAsyncThunk<
  GetWarehouseLookupResponse, // return type
  GetWarehouseLookupFilters | undefined // argument type
>(
  'lookup/fetchWarehouseLookup',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await lookupService.fetchWarehouseLookup(filters);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || 'Failed to load warehouse lookup',
        status: error?.response?.status || 500,
      });
    }
  }
);

/**
 * Thunk to fetch active lot adjustment types for lookup use.
 *
 * This thunk calls the backend API to retrieve a list of lot adjustment types,
 * which are used in inventory-related forms and utilities such as quantity adjustment,
 * loss reporting, or defective handling.
 *
 * By default, it excludes internal-only adjustment types like `manual_stock_insert`
 * and `manual_stock_update`, which are used internally by system processes and not
 * meant for user-facing selection. This behavior can be overridden by setting the
 * `excludeInternal` flag to `false`.
 *
 * @param {boolean} [excludeInternal=true] - If `true`, filters out internal-only adjustment types.
 * @returns {Promise<LotAdjustmentTypeLookupResponse,>} A promise resolving to a list of lot adjustment types formatted for Lookups.
 *
 * @example
 * // Fetch adjustment types for lookup, excluding internal-only one's
 * dispatch(fetchLotAdjustmentLookupThunk());
 *
 * @example
 * // Fetch all adjustment types, including internal-use types
 * dispatch(fetchLotAdjustmentLookupThunk(false));
 */
export const fetchLotAdjustmentTypeLookupThunk = createAsyncThunk<
  LotAdjustmentTypeLookupResponse, // return type
  boolean | undefined // input param type
>(
  'Lookups/fetchLotAdjustmentTypeLookup',
  async (excludeInternal = true, { rejectWithValue }) => {
    try {
      return await lookupService.fetchLotAdjustmentTypeLookup(excludeInternal);
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);
