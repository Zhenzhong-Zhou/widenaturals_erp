import type {
  FetchPaginatedOrderTypesParams,
  OrderTypeListResponse
} from '@features/orderType/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { buildQueryString } from '@utils/api/buildQueryString';
import { getRequest } from '@utils/apiRequest';

/**
 * Fetches a paginated and filtered list of order types from the backend.
 *
 * @param params - Pagination, sorting, and filter parameters
 * @returns A promise resolving to the paginated list of order types
 *
 * @throws {Error} If the request fails
 */
export const fetchPaginatedOrderTypes = async (
  params: FetchPaginatedOrderTypesParams
): Promise<OrderTypeListResponse> => {
  try {
    const url = `${API_ENDPOINTS.ORDER_TYPES.ALL_RECORDS}${buildQueryString(params)}`;
    return getRequest<OrderTypeListResponse>(url);
  } catch (error) {
    console.error('Error fetching order types:', error);
    throw new Error('An error occurred while fetching order types.');
  }
};

export const orderTypeService = {
  fetchPaginatedOrderTypes,
};
