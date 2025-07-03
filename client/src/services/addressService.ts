import type { AddressInputArray, CreateAddressApiResponse } from '@features/address/state/addressTypes';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { postRequest } from '@utils/apiRequest';

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

export const addressService = {
  createAddresses,
};
