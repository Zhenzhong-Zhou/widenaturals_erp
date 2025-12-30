import type {
  CreateSalesOrderInput,
  CreateSalesOrderResponse,
  GetOrderDetailsResponse,
  OrderListResponse,
  OrderQueryParams,
  OrderRouteParams,
  UpdateOrderStatusResponse,
} from '@features/order/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, patchRequest, postRequest } from '@utils/apiRequest';
import { sanitizeString } from '@utils/stringUtils';
import { AppError } from '@utils/error';

/**
 * Sends a request to create a new order under a specific category (e.g., 'sales', 'purchase').
 *
 * The `category` is injected into the URL path (e.g., `/orders/create/sales`),
 * and the `data` contains the full order payload including customer info,
 * addresses, line items, pricing, tax, and shipping details.
 *
 * @param category - Order category used to determine the order creation route (e.g., 'sales', 'transfer').
 * @param data - Payload for the new order including metadata and order items.
 * @returns A promise resolving to the success response with the new order ID.
 * @throws Will throw and rethrow any error encountered during the request.
 */
const createSalesOrder = async (
  category: string,
  data: CreateSalesOrderInput
): Promise<CreateSalesOrderResponse> => {
  const url = API_ENDPOINTS.ORDERS.ADD_NEW_ORDER(category);

  try {
    return await postRequest<CreateSalesOrderInput, CreateSalesOrderResponse>(
      url,
      data
    );
  } catch (error) {
    console.error('Failed to create sales order:', error);
    throw error;
  }
};

/* =========================================================
 * Orders
 * ======================================================= */

/**
 * Fetches a paginated and filtered list of orders by category.
 *
 * Issues `GET /orders/:category` with optional query parameters.
 *
 * Design notes:
 * - Category is sanitized before URL construction
 * - Transport concerns (retry, timeout, normalization) are centralized
 * - This function does NOT log or swallow errors
 *
 * @param category - Order category (e.g. 'sales', 'purchase')
 * @param params - Pagination, sorting, and filter parameters
 *
 * @returns Paginated order list response
 *
 * @throws {AppError}
 */
const fetchOrdersByCategory = async (
  category: string,
  params?: OrderQueryParams
): Promise<OrderListResponse> => {
  const cleanCategory = sanitizeString(category);
  
  if (!cleanCategory) {
    throw AppError.validation(
      'Order category is required',
      { category }
    );
  }
  
  const url =
    API_ENDPOINTS.ORDERS.ALL_CATEGORY_ORDERS(cleanCategory);
  
  const data = await getRequest<OrderListResponse>(url, {
    policy: 'READ',
    config: {
      params,
    },
  });
  
  // ----------------------------------
  // Defensive response validation
  // ----------------------------------
  if (!data || typeof data !== 'object') {
    throw AppError.server(
      'Invalid order list response',
      { category: cleanCategory, params }
    );
  }
  
  return data;
};

/**
 * Fetch a single order's details (header + items) by ID.
 *
 * Issues `GET /orders/:orderId` and returns the API envelope
 * `ApiSuccessResponse<TransformedOrder>`.
 *
 * Notes:
 * - This call does not accept query flags (e.g., includeAddresses, formattedOnly).
 * - Ensure `API_ENDPOINTS.ORDERS.ORDER_DETAILS` is a function:
 *     ORDER_DETAILS: (orderId: string) => `/orders/${orderId}`
 *
 * @param category
 * @param orderId - Order UUID string (will be trimmed before use).
 * @returns A promise resolving to the order details response.
 * @throws Rethrows any error from the underlying request helper.
 *
 * @example
 * const res = await fetchOrderDetailsById('0edac644-af24-4499-817e-cb593747dd1c');
 * console.log(res.data.orderNumber);
 */
const fetchOrderDetailsById = async ({
  category,
  orderId,
}: OrderRouteParams): Promise<GetOrderDetailsResponse> => {
  const cleanId = sanitizeString(orderId);
  const cleanCategory = sanitizeString(category);
  const url = API_ENDPOINTS.ORDERS.ORDER_DETAILS(cleanCategory, cleanId);

  try {
    return await getRequest<GetOrderDetailsResponse>(url);
  } catch (error) {
    console.error('Failed to fetch order details:', {
      orderId: cleanId,
      error,
    });
    throw error;
  }
};

/**
 * Sends a request to update the status of a specific order.
 *
 * The `category` and `orderId` are injected into the URL path
 * (e.g., `/orders/sales/abc123/status`), and the `data` includes
 * the next status code to apply.
 *
 * @param params - Object containing the order category and order ID.
 * @param data - Payload containing the new status code.
 * @returns A promise resolving to the updated order and item statuses.
 * @throws Will log and rethrow any error encountered during the request.
 */
const updateOrderStatus = async (
  params: OrderRouteParams,
  data: { statusCode: string }
): Promise<UpdateOrderStatusResponse> => {
  const cleanCategory = sanitizeString(params.category);
  const cleanOrderId = sanitizeString(params.orderId);

  if (!cleanCategory || !cleanOrderId) {
    throw new Error('Missing or invalid category/orderId');
  }

  const url = API_ENDPOINTS.ORDERS.ORDER_STATUS_UPDATE_PATH(
    cleanCategory,
    cleanOrderId
  );

  try {
    return await patchRequest<typeof data, UpdateOrderStatusResponse>(
      url,
      data
    );
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }
};

export const orderService = {
  createSalesOrder,
  fetchOrdersByCategory,
  fetchOrderDetailsById,
  updateOrderStatus,
};
