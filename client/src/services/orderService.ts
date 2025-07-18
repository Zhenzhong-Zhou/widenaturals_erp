import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  AllocationEligibleOrderDetailsResponse,
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
 * Generic function to fetch orders from a given endpoint with optional parameters.
 *
 * @param {string} endpoint - The API endpoint to fetch from.
 * @param {FetchOrdersParams} params - Query parameters for pagination, sorting, etc.
 * @returns {Promise<OrdersResponse>} - The fetched orders and pagination info.
 * @throws {Error} - If the request fails.
 */
const fetchOrdersByEndpoint = async (
  endpoint: string,
  params: FetchOrdersParams
): Promise<OrdersResponse> => {
  try {
    const response = await axiosInstance.get<OrdersResponse>(endpoint, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders from ${endpoint}:`, error);
    throw new Error('An error occurred while fetching orders.');
  }
};

/**
 * Fetch all orders from the server.
 */
const fetchAllOrders = (params: FetchOrdersParams): Promise<OrdersResponse> =>
  fetchOrdersByEndpoint(API_ENDPOINTS.ALL_ORDERS, params);

/**
 * Fetch allocation-eligible orders from the server.
 *
 * Includes orders in statuses like CONFIRMED, ALLOCATING, ALLOCATED, and PARTIAL.
 */
const fetchAllocationEligibleOrders = (
  params: FetchOrdersParams
): Promise<OrdersResponse> =>
  fetchOrdersByEndpoint(API_ENDPOINTS.ALLOCATION_ELIGIBLE_ORDERS, params);

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

/**
 * Fetches allocation-eligible order details for inventory allocation.
 *
 * @param {string} orderId - The ID of the order.
 * @returns {Promise<AllocationEligibleOrderDetailsResponse>} - Transformed allocation data.
 * @throws {Error} - If the request fails.
 */
export const fetchAllocationEligibleOrderDetails = async (
  orderId: string
): Promise<AllocationEligibleOrderDetailsResponse> => {
  try {
    const endpoint = API_ENDPOINTS.ALLOCATION_ELIGIBLE_ORDER_DETAILS.replace(
      ':id',
      orderId
    );
    const response =
      await axiosInstance.get<AllocationEligibleOrderDetailsResponse>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching allocation-eligible order details:', error);
    throw new Error(
      'Failed to fetch allocation details. Please try again later.'
    );
  }
};

export const orderService = {
  createSalesOrder,
  fetchAllOrders,
  fetchAllocationEligibleOrders,
  fetchSalesOrderDetails,
  confirmSalesOrder,
  fetchAllocationEligibleOrderDetails,
};
