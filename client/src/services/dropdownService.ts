import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  ProductDropdownItem,
  WarehouseDropdownItem,
} from '@features/warehouseInventory';
import type { OrderType } from '@features/order';
import type { FetchCustomersDropdownResponse } from '@features/customer';
import type { DiscountDropdownItem } from '@features/discount';
import type { TaxRateDropdownResponse } from '@features/taxRate';
import type { DeliveryMethodDropdownResponse } from '@features/deliveryMethod';
import type { ProductDropdownResponse } from '@features/product/state';
import type { PricingTypeDropdownResponse } from '@features/pricingType';

/**
 * Fetch active products for dropdown
 */
const fetchProductsForWarehouseDropdown = async (
  warehouseId?: string
): Promise<ProductDropdownItem[]> => {
  if (!warehouseId) {
    console.warn('Warning: No warehouse ID provided, returning empty list.');
    return [];
  }

  try {
    const endpoint = API_ENDPOINTS.PRODUCTS_DROPDOWN_WAREHOUSE.replace(
      ':warehouseId',
      warehouseId
    );
    const response = await axiosInstance.get<ProductDropdownItem[]>(endpoint);
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
export const fetchDeliveryMethodsForDropdown = async (
  includePickup: boolean = false
): Promise<DeliveryMethodDropdownResponse> => {
  try {
    const response = await axiosInstance.get<DeliveryMethodDropdownResponse>(
      API_ENDPOINTS.DELIVERY_METHODS_DROPDOWN,
      {
        params: { includePickup: includePickup.toString() }, // Convert boolean to string ('true' / 'false')
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching delivery methods:', error);
    throw error;
  }
};

/**
 * Fetches available products for the dropdown menu.
 *
 * @param {string | null} search - Search term to filter by product name, SKU, or barcode.
 * @param {number} limit - The maximum number of results to fetch. Default is 100.
 * @returns {Promise<ProductDropdownResponse>} - List of products formatted for the dropdown.
 */
const fetchProductsForOrdersDropdown = async (
  search: string | null = null,
  limit: number = 100
): Promise<ProductDropdownResponse> => {
  try {
    const response = await axiosInstance.get<ProductDropdownResponse>(
      API_ENDPOINTS.PRODUCTS_DROPDOWN_ORDERS,
      { params: { search, limit } }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching products for dropdown:', error);
    throw error;
  }
};

/**
 * Fetches pricing types for dropdown based on a given product ID.
 *
 * @param {string} productId - The ID of the product to fetch related pricing types.
 * @returns {Promise<PricingTypeDropdownResponse>} - List of pricing type options.
 * @throws {Error} - Throws an error if the request fails or productId is missing.
 */
export const fetchPricingTypeDropdown = async (
  productId: string
): Promise<PricingTypeDropdownResponse> => {
  if (!productId) {
    throw new Error('Product ID is required to fetch pricing types.');
  }

  try {
    const response = await axiosInstance.get<PricingTypeDropdownResponse>(
      `${API_ENDPOINTS.PRICING_TYPES_DROPDOWN}?productId=${productId}`
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching pricing type dropdown:', error);
    throw error;
  }
};

export const dropdownService = {
  fetchProductsForWarehouseDropdown,
  fetchWarehousesForDropdown,
  fetchOrderTypesForDropdown,
  fetchCustomersForDropdown,
  fetchDiscountsForDropdown,
  fetchTaxRatesForDropdown,
  fetchDeliveryMethodsForDropdown,
  fetchProductsForOrdersDropdown,
  fetchPricingTypeDropdown,
};
