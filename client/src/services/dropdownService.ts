import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import {
  ProductDropdownItem,
  WarehouseDropdownItem,
} from '../features/warehouse-inventory';
import { OrderType } from '../features/order';
import { FetchCustomersDropdownResponse } from '../features/customer';
import { DiscountDropdownItem } from '../features/discount';
import { TaxRateDropdownResponse } from '../features/taxRate';
import { DeliveryMethodDropdownResponse } from '../features/deliveryMethod';

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
const fetchCustomersForDropdown = async (
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

/**
 * Fetches available discounts for a dropdown list.
 * @returns {Promise<DiscountDropdownItem[]>} - List of discount dropdown options.
 */
const fetchDiscountsForDropdown = async (): Promise<DiscountDropdownItem[]> => {
  try {
    const response = await axiosInstance.get<DiscountDropdownItem[]>(
      API_ENDPOINTS.DISCOUNTS_DROPDOWN
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching discount dropdown:', error);
    throw error;
  }
};

/**
 * Fetches tax rates for a dropdown.
 * Filters by:
 * - `region` (default: 'Canada')
 * - `province` (optional)
 *
 * @param {string} region - The region to filter by (e.g., 'Canada').
 * @param {string|null} province - The province to filter by (optional).
 * @returns {Promise<TaxRateDropdownResponse>} - A list of formatted tax rates.
 */
const fetchTaxRatesForDropdown = async (
  region: string = 'Canada',
  province: string | null = null
): Promise<TaxRateDropdownResponse> => {
  try {
    const response = await axiosInstance.get<TaxRateDropdownResponse>(
      API_ENDPOINTS.TAX_RATES_DROPDOWN,
      { params: { region, province } }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching tax rates for dropdown:', error);
    throw error;
  }
};

/**
 * Fetches available delivery methods from the server.
 * @param {boolean} includePickup - Whether to include In-Store Pickup methods. (Default: false)
 * @returns {Promise<DeliveryMethodDropdownResponse>} - List of delivery methods.
 */
export const fetchDeliveryMethodsForDropdown = async (includePickup: boolean = false): Promise<DeliveryMethodDropdownResponse> => {
  try {
    const response = await axiosInstance.get<DeliveryMethodDropdownResponse>(
      API_ENDPOINTS.DELIVERY_METHODS_DROPDOWN,
      {
        params: { includePickup: includePickup.toString() } // Convert boolean to string ('true' / 'false')
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery methods:', error);
    throw error;
  }
};

export const dropdownService = {
  fetchProductsForDropdown,
  fetchWarehousesForDropdown,
  fetchOrderTypesForDropdown,
  fetchCustomersForDropdown,
  fetchDiscountsForDropdown,
  fetchTaxRatesForDropdown,
  fetchDeliveryMethodsForDropdown,
};
