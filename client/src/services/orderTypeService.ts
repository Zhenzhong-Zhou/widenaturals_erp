import { OrderTypeResponse } from '../features/orderType';
import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';

const fetchAllOrderTypes = async (): Promise<OrderTypeResponse> => {
  try {
    const response = await axiosInstance.get<OrderTypeResponse>(API_ENDPOINTS.ALL_ORDER_TYPES);
    return response.data;
  } catch (error) {
    console.error("Error fetching order types:", error);
    throw new Error("An error occurred while fetching order types.");
  }
};

export const orderTypeService = {
  fetchAllOrderTypes
};
