import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  AddressByCustomerLookupResponse,
  CustomerLookupQuery,
  CustomerLookupResponse,
  GetBatchRegistryLookupParams,
  GetBatchRegistryLookupResponse,
  GetWarehouseLookupResponse,
  LotAdjustmentLookupQueryParams,
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
 * Fetches a list of active warehouses, optionally filtered by warehouse type.
 *
 * @param {string | undefined} [warehouseTypeId] - Optional warehouse type ID for filtering
 * @returns {Promise<GetWarehouseLookupResponse>} - API response with lookup items
 */
export const fetchWarehouseLookupThunk = createAsyncThunk<
  GetWarehouseLookupResponse, // return type
  { warehouseTypeId?: string } | undefined
>(
  'lookup/fetchWarehouseLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchWarehouseLookup(params?.warehouseTypeId);
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
 * meant for user-facing selection. This behavior can be controlled using the filter options.
 *
 * @param {LotAdjustmentLookupQueryParams} [filters] - Optional filters to control query behavior.
 * @returns {Promise<LotAdjustmentTypeLookupResponse>} A promise resolving to a list of lot adjustment types formatted for Lookups.
 *
 * @example
 * // Fetch adjustment types for lookup, excluding internal-only one's
 * dispatch(fetchLotAdjustmentTypeLookupThunk({ excludeInternal: true }));
 *
 * @example
 * // Fetch all adjustment types, including internal-use types
 * dispatch(fetchLotAdjustmentTypeLookupThunk({ excludeInternal: false }));
 */
export const fetchLotAdjustmentTypeLookupThunk = createAsyncThunk<
  LotAdjustmentTypeLookupResponse,                // return type
  LotAdjustmentLookupQueryParams | undefined      // input param type
>(
  'Lookups/fetchLotAdjustmentTypeLookup',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await lookupService.fetchLotAdjustmentTypeLookup(filters);
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

/**
 * Thunk to fetch customer lookup data from the server with optional filters.
 *
 * - Dispatches `pending`, `fulfilled`, and `rejected` actions automatically.
 * - Useful for dropdowns, autocompletes, or selection inputs that list customers.
 *
 * @param params - Optional filters such as `keyword`, `limit`, and `offset`
 * @returns A thunk action resolving to customer lookup data or error payload
 */
export const fetchCustomerLookupThunk = createAsyncThunk<
  CustomerLookupResponse, // The resolved data shape on success
  CustomerLookupQuery | undefined, // The argument passed to the thunk
  {
    rejectValue: string | object; // Type for the reject payload
  }
>(
  'lookup/fetchCustomerLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchCustomerLookup(params);
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || 'Failed to fetch customer lookup');
    }
  }
);

/**
 * Thunk action to fetch all addresses associated with a given customer ID.
 *
 * This thunk dispatches the following async action types:
 * - pending: when the request is initiated
 * - fulfilled: when address data is successfully retrieved
 * - rejected: when the request fails (e.g., network error or invalid customer ID)
 *
 * Used in workflows such as
 * - Sales order creation
 * - Shipping/billing address selection
 *
 * @param {string} customerId - UUID of the customer to fetch addresses for
 * @returns {Promise<AddressByCustomerLookupResponse>} - Promise resolving with address data
 */
export const fetchCustomerAddressesLookupThunk = createAsyncThunk<
  AddressByCustomerLookupResponse,
  string,
  {
    rejectValue: { message: string };
  }
>(
  'addresses/fetchByCustomerId',
  async (customerId, { rejectWithValue }) => {
    try {
      return await lookupService.fetchAddressesByCustomerId(customerId);
    } catch (error) {
      console.error('fetchCustomerAddressesThunk failed:', error);
      return rejectWithValue({
        message: 'Failed to load customer addresses',
      });
    }
  }
);
