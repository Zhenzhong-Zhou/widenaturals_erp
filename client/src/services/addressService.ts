import type {
  AddressInputArray,
  AddressQueryParams,
  CreateAddressApiResponse,
  PaginatedAddressResponse,
} from '@features/address/state/addressTypes';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, postRequest } from '@utils/apiRequest';
import { buildQueryString } from '@utils/buildQueryString';

/**
 * Submits one or more addresses to the API for creation.
 *
 * - Sends a POST request with the provided address data.
 * - Supports both single and bulk address creation.
 * - Returns the API response containing the created address record(s) with metadata.
 * - Rethrows network or API errors for the caller to handle.
 *
 * @param {AddressInputArray} addresses - Array of address input objects to create.
 * @returns {Promise<CreateAddressApiResponse>} The API response containing created address record(s).
 * @throws Will rethrow network or API errors for upstream handling.
 */
export const createAddresses = async (
  addresses: AddressInputArray
): Promise<CreateAddressApiResponse> => {
  const url = API_ENDPOINTS.ADDRESSES.ADD_NEW_ADDRESSES;

  try {
    return await postRequest<AddressInputArray, CreateAddressApiResponse>(
      url,
      addresses
    );
  } catch (error) {
    // Optional: Add structured logging if desired
    console.error('Failed to create addresses:', error);
    throw error;
  }
};

/**
 * Fetches paginated address records from the API using optional query parameters.
 *
 * Makes a GET request to the `ALL_RECORDS` address endpoint with pagination,
 * sorting, and filtering options.
 * Use `buildQueryString` to serialize query parameters into the URL.
 * Intended for use in domain services or UI layers where address listings are displayed.
 *
 * @param {AddressQueryParams} [queryParams] - Optional query parameters including pagination, sort, and filters.
 * @returns {Promise<PaginatedAddressResponse>} - A promise that resolves to the paginated list of addresses with metadata.
 * @throws {Error} - Re-throws any error that occurs during the request for higher-level handling.
 */
const fetchPaginatedAddresses = async (
  queryParams?: AddressQueryParams
): Promise<PaginatedAddressResponse> => {
  const queryString = buildQueryString(queryParams);
  const url = `${API_ENDPOINTS.ADDRESSES.ALL_RECORDS}${queryString}`;

  try {
    return await getRequest<PaginatedAddressResponse>(url);
  } catch (error) {
    console.error('[fetchPaginatedAddresses] Failed to fetch addresses:', {
      queryParams,
      error,
    });
    throw error;
  }
};

export const addressService = {
  createAddresses,
  fetchPaginatedAddresses,
};
