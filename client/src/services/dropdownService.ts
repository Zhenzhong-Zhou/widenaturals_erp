import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import {
  ProductDropdownItem,
  WarehouseDropdownItem,
} from '../features/warehouse-inventory';
import { OrderType } from '../features/order';
import { FetchCustomersDropdownResponse } from '../features/customer';

/**
 * Fetch active products for dropdown
 */
const fetchProductsForDropdown = async (
  warehouseId?: string
): Promise<ProductDropdownItem[]> => {
  if (!warehouseId) {
    console.warn('Warning: No warehouse ID provided, returning empty list.');
    return [];
  }

  try {
    const response = await axiosInstance.get<ProductDropdownItem[]>(
      `${API_ENDPOINTS.PRODUCTS_DROPDOWN}?warehouse_id=${warehouseId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching product dropdown:', error);
    return [];
  }
};

/**
 * Fetch active warehouses for dropdown
 */
const fetchWarehousesForDropdown = async (): Promise<
  WarehouseDropdownItem[]
> => {
  try {
    const response = await axiosInstance.get<WarehouseDropdownItem[]>(
      API_ENDPOINTS.WAREHOUSES_DROPDOWN
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse dropdown:', error);
    return [];
  }
};

/**
 * Fetch active order types for dropdown
 */
const fetchOrderTypesForDropdown = async (): Promise<OrderType[]> => {
  try {
    const response = await axiosInstance.get<OrderType[]>(
      API_ENDPOINTS.ORDER_TYPES_DROPDOWN
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse dropdown:', error);
    return [];
  }
};

/**
 * Fetches customers for a dropdown list with optional search & limit.
 * @param {string} search - Search query (name, email, phone).
 * @param {number} limit - Number of results to fetch (default: 100).
 * @returns {Promise<FetchCustomersDropdownResponse>} - Customer dropdown options.
 */
export const fetchCustomersForDropdown = async (
  search: string = '',
  limit: number = 100
): Promise<FetchCustomersDropdownResponse> => {
  try {
    const response = await axiosInstance.get<FetchCustomersDropdownResponse>(
      API_ENDPOINTS.CUSTOMERS_DROPDOWN,
      { params: { search, limit } }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching customer dropdown:', error);
    throw error;
  }
};

export const dropdownService = {
  fetchProductsForDropdown,
  fetchWarehousesForDropdown,
  fetchOrderTypesForDropdown,
  fetchCustomersForDropdown,
};
