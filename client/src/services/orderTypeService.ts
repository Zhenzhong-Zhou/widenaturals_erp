import {
  FetchAllOrderTypesParams,
  OrderTypeResponse,
} from '../features/orderType';
import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { CreateSalesOrderResponse, SalesOrder } from '../features/order';

const fetchAllOrderTypes = async (
  params: FetchAllOrderTypesParams
): Promise<OrderTypeResponse> => {
  try {
    const response = await axiosInstance.get<OrderTypeResponse>(
      API_ENDPOINTS.ALL_ORDER_TYPES,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching order types:', error);
    throw new Error('An error occurred while fetching order types.');
  }
};

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

export const orderTypeService = {
  fetchAllOrderTypes,
  createSalesOrder,
};
