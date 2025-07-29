import type {
  CreateSalesOrderInput,
  CreateSalesOrderResponse
} from '@features/order/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { postRequest } from '@utils/apiRequest';

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
  const url = API_ENDPOINTS.ORDERS.ADD_NEW_ORDER.replace(':category', category);
  
  try {
    return await postRequest<CreateSalesOrderInput, CreateSalesOrderResponse>(url, data);
  } catch (error) {
    console.error('Failed to create sales order:', error);
    throw error;
  }
};

export const orderService = {
  createSalesOrder,
};
