import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AddressFilters, AddressInputArray, CreateAddressApiResponse, PaginatedAddressResponse } from './addressTypes';
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
 * Redux thunk to fetch a paginated list of addresses from the API using filters.
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
 * @param filters Optional address filters for pagination, search, etc.
 *
 * @returns {Promise<PaginatedAddressResponse>} The resolved API data or rejected error message.
 */
export const fetchPaginatedAddressesThunk = createAsyncThunk<
  PaginatedAddressResponse,      // Return type on success
  AddressFilters | undefined,    // Argument type (filters)
  { rejectValue: string }        // Type of the rejected value
>(
  'addresses/fetchPaginated',
  async (filters, { rejectWithValue }) => {
    try {
      return await addressService.fetchPaginatedAddresses(filters);
    } catch (error: any) {
      console.error('[fetchPaginatedAddressesThunk] Error:', { filters, error });
      return rejectWithValue(error.message || 'Failed to fetch addresses');
    }
  }
);
