import type {
  AddressFilters,
  AddressInputArray,
  CreateAddressApiResponse,
  PaginatedAddressResponse,
} from '@features/address/state/addressTypes';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, postRequest } from '@utils/apiRequest';

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
    return await postRequest<AddressInputArray, CreateAddressApiResponse>(url, addresses);
  } catch (error) {
    // Optional: Add structured logging if desired
    console.error('Failed to create addresses:', error);
    throw error;
  }
};

/**
 * Fetch paginated address records from the API using optional filters.
 *
 * Makes a GET request to the `ALL_RECORDS` address endpoint with query parameters.
 * Intended for use in domain services or UI layers where address listings are displayed.
 *
 * @param filters Optional filters to apply to the query (e.g., page, limit, keyword).
 *
 * @returns {Promise<PaginatedAddressResponse>}
 * A promise that resolves to the paginated list of addresses along with pagination metadata.
 *
 * @throws {Error}
 * Re-throws any error that occurs during the request for higher-level handling
 * (e.g., UI notifications, logging, or error boundaries).
 */
const fetchPaginatedAddresses = async (
  filters?: AddressFilters
): Promise<PaginatedAddressResponse> => {
  const url = API_ENDPOINTS.ADDRESSES.ALL_RECORDS;
  
  try {
    return await getRequest<PaginatedAddressResponse>(url, {
      params: filters,
    });
  } catch (error) {
    console.error('[fetchPaginatedAddresses] Failed to fetch addresses:', { filters, error });
    throw error;
  }
};

export const addressService = {
  createAddresses,
  fetchPaginatedAddresses,
};
