import type {
  CreateSalesOrderInput,
  CreateSalesOrderResponse,
  GetOrderDetailsResponse, OrderRouteParams,
} from '@features/order/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, postRequest } from '@utils/apiRequest';

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
    return await postRequest<CreateSalesOrderInput, CreateSalesOrderResponse>(url, data);
  } catch (error) {
    console.error('Failed to create sales order:', error);
    throw error;
  }
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
const fetchOrderDetailsById = async (
  { category, orderId }: OrderRouteParams
): Promise<GetOrderDetailsResponse> => {
  const cleanId = (orderId ?? '').trim();
  const cleanCategory = (category ?? '').trim();
  const url = API_ENDPOINTS.ORDERS.ORDER_DETAILS(cleanCategory, cleanId);
 
  try {
    return await getRequest<GetOrderDetailsResponse>(url);
  } catch (error) {
    console.error('Failed to fetch order details:', { orderId: cleanId, error });
    throw error;
  }
};

export const orderService = {
  createSalesOrder,
  fetchOrderDetailsById,
};
