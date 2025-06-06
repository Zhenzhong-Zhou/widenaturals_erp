import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  GetBatchRegistryDropdownParams,
  GetBatchRegistryDropdownResponse,
  GetWarehouseDropdownFilters,
  GetWarehouseDropdownResponse,
  LotAdjustmentTypeDropdownResponse,
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
  GetBatchRegistryDropdownParams, // Argument type
  { rejectValue: string } // Rejection payload type
>(
  'dropdown/fetchBatchRegistryDropdown',
  async (params, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchBatchRegistryDropdown(params);
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || 'Failed to fetch dropdown items'
      );
    }
  }
);

/**
 * Async thunk to fetch warehouse dropdown options.
 *
 * Fetches a list of active or filtered warehouses for use in dropdown menus.
 * Supports optional filters such as location type and warehouse type.
 *
 * @param {GetWarehouseDropdownFilters} [filters] - Optional filter parameters
 * @returns {Promise<GetWarehouseDropdownResponse>} - API response with dropdown items
 */
export const fetchWarehouseDropdownThunk = createAsyncThunk<
  GetWarehouseDropdownResponse, // return type
  GetWarehouseDropdownFilters | undefined // argument type
>(
  'dropdown/fetchWarehouseDropdown',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchWarehouseDropdown(filters);
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || 'Failed to load warehouse dropdown',
        status: error?.response?.status || 500,
      });
    }
  }
);

/**
 * Thunk to fetch active lot adjustment types for dropdown use.
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
 * @returns {Promise<LotAdjustmentDropdownResponse,>} A promise resolving to a list of lot adjustment types formatted for dropdowns.
 *
 * @example
 * // Fetch adjustment types for dropdown, excluding internal-only one's
 * dispatch(fetchLotAdjustmentDropdownThunk());
 *
 * @example
 * // Fetch all adjustment types, including internal-use types
 * dispatch(fetchLotAdjustmentDropdownThunk(false));
 */
export const fetchLotAdjustmentTypeDropdownThunk = createAsyncThunk<
  LotAdjustmentTypeDropdownResponse, // return type
  boolean | undefined // input param type
>(
  'dropdowns/fetchLotAdjustmentDropdown',
  async (excludeInternal = true, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchLotAdjustmentTypeDropdown(excludeInternal);
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);
