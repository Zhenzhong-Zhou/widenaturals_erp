import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { ProductDropdownItem, WarehouseDropdownItem } from '../features/dropdown';

/**
 * Fetch active products for dropdown
 */
const fetchProductsForDropdown = async (): Promise<ProductDropdownItem[]> => {
  try {
    const response = await axiosInstance.get<ProductDropdownItem[]>(API_ENDPOINTS.PRODUCTS_DROPDOWN);
    return response.data;
  } catch (error) {
    console.error('Error fetching product dropdown:', error);
    return [];
  }
};

/**
 * Fetch active warehouses for dropdown
 */
const fetchWarehousesForDropdown = async (): Promise<WarehouseDropdownItem[]> => {
  try {
    const response = await axiosInstance.get<WarehouseDropdownItem[]>(API_ENDPOINTS.WAREHOUSES_DROPDOWN);
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse dropdown:', error);
    return [];
  }
};

export const dropdownService = {
  fetchProductsForDropdown,
  fetchWarehousesForDropdown
};