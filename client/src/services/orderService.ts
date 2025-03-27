import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { CreateSalesOrderResponse, FetchOrdersParams, OrdersResponse, SalesOrder } from '../features/order';

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
    const endpoint = API_ENDPOINTS.CREATE_SALES_ORDERS.replace(':orderTypeId', orderTypeId);
    const response = await axiosInstance.post<CreateSalesOrderResponse>(endpoint, orderData);
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

export const orderService = {
  createSalesOrder,
  fetchAllOrders,
};
