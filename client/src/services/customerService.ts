import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  CreateCustomerResponse,
  CreateCustomersRequest,
  FetchPaginatedCustomersParams,
  PaginatedCustomerListResponse,
} from '@features/customer/state';
import { getRequest, postRequest } from '@utils/http';
import { buildQueryString } from '@utils/buildQueryString';

/**
 * Creates one or more customers.
 *
 * Issues:
 *   POST /customers
 *
 * Notes:
 * - Accepts an array payload for both single and bulk creation.
 * - Errors are propagated as normalized AppError instances by the transport layer.
 *
 * @param customers - Customer data to create.
 * @returns API response containing the created customer record(s).
 * @throws {AppError} When the request fails.
 */
const createCustomers = async (
  customers: CreateCustomersRequest
): Promise<CreateCustomerResponse> => {
  return postRequest<CreateCustomersRequest, CreateCustomerResponse>(
    API_ENDPOINTS.CUSTOMERS.ADD_NEW_CUSTOMERS,
    customers
  );
};

/**
 * Fetches a paginated list of customers with optional filters and sorting.
 *
 * Issues:
 *   GET /customers with pagination and filter query parameters.
 *
 * Notes:
 * - Filters provided in `params.filters` are flattened into top-level query parameters.
 * - Errors are propagated as normalized AppError instances by the transport layer.
 *
 * @param params - Pagination, sorting, and filter parameters.
 * @returns A paginated list of customers with metadata.
 * @throws {AppError} When the request fails.
 */
const fetchPaginatedCustomers = async (
  params: FetchPaginatedCustomersParams = {}
): Promise<PaginatedCustomerListResponse> => {
  const { filters = {}, ...rest } = params;
  
  const flatParams = {
    ...rest,
    ...filters,
  };
  
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.CUSTOMERS.ALL_CUSTOMERS}${queryString}`;
  
  return getRequest<PaginatedCustomerListResponse>(url);
};

export const customerService = {
  createCustomers,
  fetchPaginatedCustomers,
};
