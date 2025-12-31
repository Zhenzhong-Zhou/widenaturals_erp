import type {
  AddressInputArray,
  AddressQueryParams,
  CreateAddressApiResponse,
  PaginatedAddressResponse,
} from '@features/address/state/addressTypes';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, postRequest } from '@utils/http';
import { buildQueryString } from '@utils/buildQueryString';

/**
 * Submits one or more addresses to the API for creation.
 *
 * - Sends a POST request with the provided address data.
 * - Supports both single and bulk address creation.
 * - Returns the API response containing the created address record(s) with metadata.
 * - Errors are propagated as normalized AppError instances.
 *
 * @param addresses - Array of address input objects to create.
 * @returns The API response containing created address record(s).
 * @throws {AppError} When the request fails.
 */
const createAddresses = async (
  addresses: AddressInputArray
): Promise<CreateAddressApiResponse> => {
  return postRequest(
    API_ENDPOINTS.ADDRESSES.ADD_NEW_ADDRESSES,
    addresses
  );
};

/**
 * Fetches paginated address records from the API using optional query parameters.
 *
 * Makes a GET request to the address listing endpoint with pagination,
 * sorting, and filtering options. Query parameters are serialized using
 * `buildQueryString`.
 *
 * @param queryParams - Optional pagination, sort, and filter parameters.
 * @returns A paginated list of addresses with metadata.
 * @throws {AppError} When the request fails.
 */
const fetchPaginatedAddresses = async (
  queryParams?: AddressQueryParams
): Promise<PaginatedAddressResponse> => {
  const queryString = buildQueryString(queryParams);
  return getRequest(
    `${API_ENDPOINTS.ADDRESSES.ALL_RECORDS}${queryString}`
  );
};

export const addressService = {
  createAddresses,
  fetchPaginatedAddresses,
};
