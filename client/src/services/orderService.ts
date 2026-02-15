import type {
  CreateSalesOrderInput,
  CreateSalesOrderResponse,
  GetOrderDetailsApiResponse,
  OrderListResponse,
  OrderQueryParams,
  OrderRouteParams,
  UpdateOrderStatusResponse,
} from '@features/order/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, patchRequest, postRequest } from '@utils/http';
import { sanitizeString } from '@utils/stringUtils';
import { AppError } from '@utils/error';

/* =========================================================
 * Order creation
 * ======================================================= */

/**
 * Create a new order under a specific category.
 */
const createSalesOrder = (
  category: string,
  data: CreateSalesOrderInput
): Promise<CreateSalesOrderResponse> => {
  const cleanCategory = sanitizeString(category);

  if (!cleanCategory) {
    throw AppError.validation('Order category is required', { category });
  }

  return postRequest(API_ENDPOINTS.ORDERS.ADD_NEW_ORDER(cleanCategory), data);
};

/* =========================================================
 * Order queries
 * ======================================================= */

/**
 * Fetch a paginated list of orders for a category.
 */
const fetchOrdersByCategory = (
  category: string,
  params?: OrderQueryParams
): Promise<OrderListResponse> => {
  const cleanCategory = sanitizeString(category);

  if (!cleanCategory) {
    throw AppError.validation('Order category is required', { category });
  }

  return getRequest(API_ENDPOINTS.ORDERS.ALL_CATEGORY_ORDERS(cleanCategory), {
    policy: 'READ',
    config: { params },
  });
};

/**
 * Fetches raw order details from the backend API.
 *
 * This function:
 * - Sanitizes route parameters
 * - Performs strict validation
 * - Throws domain-level AppError on invalid input
 * - Returns the canonical API response (no UI transformation)
 *
 * NOTE:
 * - UI normalization must NOT happen here
 * - This function is consumed by Redux thunks only
 */
const fetchOrderDetailsById = (
  params: OrderRouteParams
): Promise<GetOrderDetailsApiResponse> => {
  const cleanCategory = sanitizeString(params.category);
  const cleanOrderId = sanitizeString(params.orderId);

  if (!cleanCategory || !cleanOrderId) {
    throw AppError.validation('Invalid category or orderId', {
      category: params.category,
      orderId: params.orderId,
    });
  }

  return getRequest<GetOrderDetailsApiResponse>(
    API_ENDPOINTS.ORDERS.ORDER_DETAILS(cleanCategory, cleanOrderId)
  );
};

/* =========================================================
 * Order mutation
 * ======================================================= */

/**
 * Update the status of an order.
 */
const updateOrderStatus = (
  params: OrderRouteParams,
  data: { statusCode: string }
): Promise<UpdateOrderStatusResponse> => {
  const cleanCategory = sanitizeString(params.category);
  const cleanOrderId = sanitizeString(params.orderId);

  if (!cleanCategory || !cleanOrderId) {
    throw AppError.validation('Invalid category or orderId', params);
  }

  return patchRequest(
    API_ENDPOINTS.ORDERS.ORDER_STATUS_UPDATE_PATH(cleanCategory, cleanOrderId),
    data
  );
};

/* =========================================================
 * Public API
 * ======================================================= */

export const orderService = {
  createSalesOrder,
  fetchOrdersByCategory,
  fetchOrderDetailsById,
  updateOrderStatus,
};
