import type {
  AddressByCustomerResponse,
  AddressInputArray,
  AddressQueryParams,
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
 * Fetch paginated address records from the API using optional query parameters.
 *
 * Makes a GET request to the `ALL_RECORDS` address endpoint with pagination,
 * sorting, and filtering options.
 * Intended for use in domain services or UI layers where address listings are displayed.
 *
 * @param queryParams Optional query parameters including pagination, sort, and filters.
 *
 * @returns {Promise<PaginatedAddressResponse>}
 * A promise that resolves to the paginated list of addresses along with pagination metadata.
 *
 * @throws {Error}
 * Re-throws any error that occurs during the request for higher-level handling
 * (e.g., UI notifications, logging, or error boundaries).
 */
const fetchPaginatedAddresses = async (
  queryParams?: AddressQueryParams
): Promise<PaginatedAddressResponse> => {
  const url = API_ENDPOINTS.ADDRESSES.ALL_RECORDS;
  
  try {
    return await getRequest<PaginatedAddressResponse>(url, {
      params: queryParams,
    });
  } catch (error) {
    console.error('[fetchPaginatedAddresses] Failed to fetch addresses:', { queryParams, error });
    throw error;
  }
};

/**
 * Fetches all addresses associated with a given customer ID.
 *
 * Used in workflows such as
 * - Sales order creation
 * - Shipping/billing address selection
 * - Customer profile display
 *
 * @param {string} customerId - UUID of the customer to fetch addresses for
 * @returns {Promise<AddressByCustomerResponse>} - API response containing an array of addresses
 * @throws Will rethrow the error if the request fails (caller must handle it)
 */
const fetchAddressesByCustomerId = async (
  customerId: string
): Promise<AddressByCustomerResponse> => {
  const url = `${API_ENDPOINTS.ADDRESSES.ADDRESSES_BY_CUSTOMER}?customerId=${customerId}`;
  
  try {
    return await getRequest<AddressByCustomerResponse>(url);
  } catch (error) {
    console.error('Failed to fetch addresses by customer ID:', error);
    throw error; // or optionally wrap in custom error if needed
  }
};

export const addressService = {
  createAddresses,
  fetchPaginatedAddresses,
  fetchAddressesByCustomerId,
};
