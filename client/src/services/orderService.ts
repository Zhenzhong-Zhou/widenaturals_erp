import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  CreateSalesOrderResponse,
  FetchOrdersParams,
  OrderDetailsResponse,
  OrdersResponse,
  OrderStatusUpdateResponse,
  SalesOrder,
} from '@features/order';

/**
 * Creates a new sales order.
 * @param {string} orderTypeId - The order type ID to replace in the endpoint.
 * @param {SalesOrder} orderData - The sales order payload.
 * @returns {Promise<CreateSalesOrderResponse>} - The structured response from the API.
 */
export const createSalesOrder = async (
  orderTypeId: string,
  orderData: SalesOrder
): Promise<CreateSalesOrderResponse> => {
  try {
    const endpoint = API_ENDPOINTS.CREATE_SALES_ORDERS.replace(
      ':orderTypeId',
      orderTypeId
    );
    const response = await axiosInstance.post<CreateSalesOrderResponse>(
      endpoint,
      orderData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating sales order:', error);
    throw error;
  }
};

/**
 * Fetch all orders from the server with optional parameters for pagination, sorting, and order number verification.
 *
 * @param {FetchOrdersParams} params - The parameters for fetching orders, including pagination, sorting, and order number verification.
 * @returns {Promise<OrdersResponse>} - A promise resolving to the orders data and pagination information.
 * @throws {Error} - Throws an error if the request fails.
 */
const fetchAllOrders = async (
  params: FetchOrdersParams
): Promise<OrdersResponse> => {
  try {
    const response = await axiosInstance.get<OrdersResponse>(
      API_ENDPOINTS.ALL_ORDERS,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw new Error('An error occurred while fetching orders.');
  }
};

/**
 * Fetch Sales Order Details
 *
 * This function fetches the details of a specific sales order by its ID.
 * It retrieves all related order information including customer details,
 * order items, prices, and additional metadata.
 *
 * @param {string} orderId - The ID of the sales order to fetch.
 * @returns {Promise<OrderDetailsResponse>} - Returns a promise resolving to the order details.
 *
 * @throws {Error} - Throws an error if the request fails.
 *
 * @example
 *  const orderDetails = await fetchSalesOrderDetails("b64ead02-0061-4713-bce6-33103018bc31");
 *  console.log(orderDetails.data.order_number); // Output: SO-SSO-20250325174708-b64ead02-b8ff650703
 */
const fetchSalesOrderDetails = async (
  orderId: string
): Promise<OrderDetailsResponse> => {
  try {
    const endpoint = API_ENDPOINTS.SALES_ORDER_DETAILS.replace(':id', orderId);
    const response = await axiosInstance.get<OrderDetailsResponse>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales order details:', error);
    throw new Error(
      'Failed to fetch sales order details. Please try again later.'
    );
  }
};

/**
 * Sends a request to confirm a sales order by ID.
 *
 * @param {string} orderId - The UUID of the sales order to be confirmed.
 * @returns {Promise<OrderStatusUpdateResponse>} - Confirmation result containing updated counts and order ID.
 * @throws {Error} - Throws an error if the request fails.
 */
const confirmSalesOrder = async (
  orderId: string
): Promise<OrderStatusUpdateResponse> => {
  try {
    const endpoint = API_ENDPOINTS.CONFIRM_SALES_ORDER.replace(
      ':orderId',
      orderId
    );
    const response =
      await axiosInstance.post<OrderStatusUpdateResponse>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error confirming sales order:', error);
    throw new Error(
      'Failed to confirm the sales order. Please try again later.'
    );
  }
};

export const orderService = {
  createSalesOrder,
  fetchAllOrders,
  fetchSalesOrderDetails,
  confirmSalesOrder,
};
