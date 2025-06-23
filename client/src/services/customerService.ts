import { API_ENDPOINTS } from '@services/apiEndpoints';
import type { CreateCustomerResponse, CreateCustomersRequest } from '@features/customer/state';
import { postRequest } from '@utils/apiRequest';

/**
 * Sends a request to create one or more customers.
 *
 * - Accepts an array of customer payloads (even for single customer).
 * - Returns either a single customer response or a bulk customer response,
 *   wrapped in a standard API success structure.
 * - Automatically handles API response types for both single and bulk creation.
 *
 * @param {CreateCustomersRequest} customers - List of customer data to be created.
 * @returns {Promise<CreateCustomerResponse>} - API response containing created customer(s).
 * @throws {Error} - If the request fails or the API responds with an error.
 */
const createCustomers = async (
  customers: CreateCustomersRequest
): Promise<CreateCustomerResponse> => {
  try {
    return await postRequest<CreateCustomersRequest, CreateCustomerResponse>(
      API_ENDPOINTS.CUSTOMERS.ADD_NEW_CUSTOMERS,
      customers
    );
  } catch (error) {
    console.error('Failed to create customers', error);
    throw error;
  }
};

export const customerService = {
  createCustomers,
};
