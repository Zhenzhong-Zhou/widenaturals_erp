import type {
  FetchPaginatedOrderTypesParams,
  OrderTypeListResponse,
} from '@features/orderType/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { buildQueryString } from '@utils/buildQueryString';
import { getRequest } from '@utils/http';

/* =========================================================
 * Order Type
 * ======================================================= */

/**
 * Fetch a paginated list of order types.
 */
const fetchPaginatedOrderTypes = (
  params: FetchPaginatedOrderTypesParams
): Promise<OrderTypeListResponse> => {
  const queryString = buildQueryString(params);

  return getRequest(`${API_ENDPOINTS.ORDER_TYPES.ALL_RECORDS}${queryString}`);
};

export const orderTypeService = {
  fetchPaginatedOrderTypes,
};
