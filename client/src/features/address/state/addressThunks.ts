import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AddressInputArray, CreateAddressApiResponse } from './addressTypes';
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
