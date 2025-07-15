import type {
  FetchPaginatedOrderTypesParams,
  OrderTypeListResponse
} from '@features/orderType/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { buildQueryString } from '@utils/buildQueryString';
import { getRequest } from '@utils/apiRequest';

/**
 * Fetches a paginated and optionally filtered list of order types from the backend.
 *
 * Constructs a query string from pagination, sorting, and filter parameters using `buildQueryString`,
 * and sends a GET request to the order types endpoint.
 *
 * This is typically used for:
 * - Admin/configuration panels to manage order types
 * - Filtered lookups in order creation or management views
 *
 * @param {FetchPaginatedOrderTypesParams} params - Object containing pagination, sorting, and filtering options
 * @returns {Promise<OrderTypeListResponse>} A promise that resolves to the list of order types with pagination metadata
 *
 * @throws {Error} Rethrows any error encountered during the request and wraps it with a user-friendly message
 */
export const fetchPaginatedOrderTypes = async (
  params: FetchPaginatedOrderTypesParams
): Promise<OrderTypeListResponse> => {
  try {
    const queryString = buildQueryString(params);
    const url = `${API_ENDPOINTS.ORDER_TYPES.ALL_RECORDS}${queryString}`;
    
    return getRequest<OrderTypeListResponse>(url);
  } catch (error) {
    console.error('Error fetching order types:', error);
    throw new Error('An error occurred while fetching order types.');
  }
};

export const orderTypeService = {
  fetchPaginatedOrderTypes,
};
