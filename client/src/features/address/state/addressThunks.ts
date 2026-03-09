import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  AddressInputArray,
  AddressQueryParams,
  CreateAddressApiResponse,
  PaginatedAddressResponse,
} from './addressTypes';
import { addressService } from '@services/addressService';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { ErrorType, extractUiErrorPayload } from '@utils/error';

/**
 * Redux thunk that creates address records via API.
 *
 * Behavior:
 * - On success: returns {@link CreateAddressApiResponse}.
 * - On failure: rejects with a structured {@link UiErrorPayload}.
 *
 * Error handling:
 * - All errors are normalized via `extractUiErrorPayload`.
 * - Ensures reducers receive consistent UI-safe error metadata.
 *
 * @param {AddressInputArray} addresses - Array of address objects to submit.
 * @returns {Promise<CreateAddressApiResponse>}
 */
export const createAddressesThunk = createAsyncThunk<
  CreateAddressApiResponse,
  AddressInputArray,
  { rejectValue: UiErrorPayload }
>('addresses/createAddresses', async (addresses, { rejectWithValue }) => {
  try {
    const response = await addressService.createAddresses(addresses);

    if (!response || !response.data) {
      return rejectWithValue({
        message: 'Invalid API response.',
        type: ErrorType.Unknown,
      });
    }

    return response;
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Redux thunk to fetch a paginated list of addresses.
 *
 * On success:
 * - Returns {@link PaginatedAddressResponse}.
 *
 * On failure:
 * - Rejects with a structured {@link UiErrorPayload}.
 * - Errors are normalized using `extractUiErrorPayload`.
 *
 * Action type prefix: `addresses/fetchPaginated`
 *
 * @param queryParams Optional filters, pagination, and sorting options.
 * @returns {Promise<PaginatedAddressResponse>}
 */
export const fetchPaginatedAddressesThunk = createAsyncThunk<
  PaginatedAddressResponse,
  AddressQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>('addresses/fetchPaginated', async (queryParams, { rejectWithValue }) => {
  try {
    return await addressService.fetchPaginatedAddresses(queryParams);
  } catch (error: unknown) {
    console.error('[fetchPaginatedAddressesThunk] Error:', {
      queryParams,
      error,
    });

    return rejectWithValue(extractUiErrorPayload(error));
  }
});
