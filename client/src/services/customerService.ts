import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  CreateCustomerResponse,
  CreateCustomersRequest,
  FetchPaginatedCustomersParams,
  PaginatedCustomerListResponse,
} from '@features/customer/state';
import { getRequest, postRequest } from '@utils/apiRequest';

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

/**
 * Fetches paginated customer data from the server with optional filters and sorting.
 *
 * This function:
 * - Sends a GET request to the customers endpoint
 * - Supports pagination, sorting, and filtering via query parameters
 * - Handles typed responses for consistent client behavior
 *
 * @param {FetchPaginatedCustomersParams} [params={}] - Query parameters including pagination, filters, and sort config
 * @returns {Promise<PaginatedCustomerListResponse>} - A promise that resolves to a paginated list of customers
 * @throws {Error} - If the request fails or the server returns an error
 */
const fetchPaginatedCustomers = async (
  params: FetchPaginatedCustomersParams = {}
): Promise<PaginatedCustomerListResponse> => {
  try {
    return await getRequest<PaginatedCustomerListResponse>(
      API_ENDPOINTS.CUSTOMERS.ALL_CUSTOMERS,
      { params } // pass as `params` to Axios
    );
  } catch (error) {
    console.error('Failed to fetch paginated customers:', error);
    throw error;
  }
};

export const customerService = {
  createCustomers,
  fetchPaginatedCustomers,
};
