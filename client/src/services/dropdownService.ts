import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  GetBatchRegistryDropdownParams,
  GetBatchRegistryDropdownResponse,
  GetWarehouseDropdownFilters,
  GetWarehouseDropdownResponse,
} from '@features/dropdown/state/dropdownTypes';

/**
 * Fetches dropdown-compatible batch registry records.
 *
 * Supports filtering by batch type (e.g., 'product', 'packaging_material'),
 * exclusion of specific IDs, and pagination controls (limit/offset).
 *
 * @param params - Optional filters and pagination options.
 * @returns A promise resolving to the batch registry dropdown response.
 * @throws Throws an error if the network request fails.
 */
const fetchBatchRegistryDropdown = async (
  params: GetBatchRegistryDropdownParams = {}
): Promise<GetBatchRegistryDropdownResponse> => {
  try {
    const response = await axiosInstance.get<GetBatchRegistryDropdownResponse>(
      API_ENDPOINTS.DROPDOWN.BATCH_REGISTRY,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch batch registry dropdown:', error);
    throw error;
  }
};

/**
 * Fetches a list of warehouses for dropdown use.
 *
 * Supports filtering by:
 * - `locationTypeId`: optional ID to filter warehouses by location type
 * - `warehouseTypeId`: optional ID to filter warehouses by warehouse type
 * - `includeArchived`: whether to include archived warehouses (default: false)
 *
 * @param {GetWarehouseDropdownFilters} filters - Optional query parameters to filter dropdown results
 * @returns {Promise<GetWarehouseDropdownResponse>} Response containing warehouse dropdown items
 * @throws {Error} Rethrows any error encountered during API call
 */
const fetchWarehouseDropdown = async (
  filters: GetWarehouseDropdownFilters = {}
): Promise<GetWarehouseDropdownResponse> => {
  try {
    const response = await axiosInstance.get<GetWarehouseDropdownResponse>(
      API_ENDPOINTS.DROPDOWN.WAREHOUSES,
      { params: filters }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch warehouse dropdown:', error);
    throw error;
  }
};

export const dropdownService = {
  fetchBatchRegistryDropdown,
  fetchWarehouseDropdown,
};
