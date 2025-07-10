import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  AddressByCustomerResponse,
  AddressInputArray,
  AddressQueryParams,
  CreateAddressApiResponse,
  PaginatedAddressResponse,
} from './addressTypes';
import { addressService } from '@services/addressService.ts';

/**
 * Redux thunk that creates address records via API and dispatches status actions.
 *
 * - Handles API success and failure cases.
 * - Returns the API response on success, or rejects with an error message on failure.
 *
 * @param {AddressInputArray} addresses - The array of address objects to submit.
 * @returns {Promise<CreateAddressApiResponse>} The resolved API response data.
 */
export const createAddressesThunk = createAsyncThunk<
  CreateAddressApiResponse,   // return type
  AddressInputArray,          // argument type
  { rejectValue: string }      // error type for rejectWithValue
>(
  'addresses/createAddresses',
  async (addresses, { rejectWithValue }) => {
    try {
      const response = await addressService.createAddresses(addresses);
      if (!response || !response.data) {
        return rejectWithValue('Invalid API response.');
      }
      return response;
    } catch (error: any) {
      // Extract a friendly error message or default fallback
      const message =
        error?.response?.data?.message || error?.message || 'Failed to create addresses.';
      return rejectWithValue(message);
    }
  }
);

/**
 * Redux thunk to fetch a paginated list of addresses from the API using query parameters.
 *
 * Dispatches pending, fulfilled, and rejected actions automatically.
 * Intended for use in address list views where pagination, search, or filtering is needed.
 *
 * On success:
 * - Returns a {@link PaginatedAddressResponse} containing address data and pagination metadata.
 *
 * On failure:
 * - Returns a custom error message via `rejectWithValue` for reducers to handle.
 *
 * Action type prefix: `addresses/fetchPaginated`
 *
 * @param queryParams Optional query parameters including filters, pagination, and sort options.
 *
 * @returns {Promise<PaginatedAddressResponse>} The resolved API data or rejected error message.
 */
export const fetchPaginatedAddressesThunk = createAsyncThunk<
  PaginatedAddressResponse,           // Return type on success
  AddressQueryParams | undefined,     // Argument type (query parameters)
  { rejectValue: string }             // Type of the rejected value
>(
  'addresses/fetchPaginated',
  async (queryParams, { rejectWithValue }) => {
    try {
      return await addressService.fetchPaginatedAddresses(queryParams);
    } catch (error: any) {
      console.error('[fetchPaginatedAddressesThunk] Error:', { queryParams, error });
      return rejectWithValue(error.message || 'Failed to fetch addresses');
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
 * @returns {Promise<AddressByCustomerResponse>} - Promise resolving with address data
 */
export const fetchCustomerAddressesThunk = createAsyncThunk<
  AddressByCustomerResponse,
  string,
  {
    rejectValue: { message: string };
  }
>(
  'addresses/fetchByCustomerId',
  async (customerId, { rejectWithValue }) => {
    try {
      return await addressService.fetchAddressesByCustomerId(customerId);
    } catch (error) {
      console.error('fetchCustomerAddressesThunk failed:', error);
      return rejectWithValue({
        message: 'Failed to load customer addresses',
      });
    }
  }
);
