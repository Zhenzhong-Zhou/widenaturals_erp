import type {
  FetchPaginatedOrderTypesParams,
  OrderTypeListApiResponse,
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
): Promise<OrderTypeListApiResponse> => {
  const queryString = buildQueryString(params);

  return getRequest<OrderTypeListApiResponse>(
    `${API_ENDPOINTS.ORDER_TYPES.ALL_RECORDS}${queryString}`
  );
};

export const orderTypeService = {
  fetchPaginatedOrderTypes,
};
