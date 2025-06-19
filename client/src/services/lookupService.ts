import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  GetBatchRegistryLookupParams,
  GetBatchRegistryLookupResponse,
  GetWarehouseLookupFilters,
  GetWarehouseLookupResponse, LotAdjustmentLookupQueryParams,
  LotAdjustmentTypeLookupResponse,
} from '@features/lookup/state/lookupTypes';

/**
 * Fetches lookup-compatible batch registry records.
 *
 * Supports filtering by batch type (e.g., 'product', 'packaging_material'),
 * exclusion of specific IDs, and pagination controls (limit/offset).
 *
 * @param params - Optional filters and pagination options.
 * @returns A promise resolving to the batch registry lookup response.
 * @throws Throws an error if the network request fails.
 */
const fetchBatchRegistryLookup = async (
  params: GetBatchRegistryLookupParams = {}
): Promise<GetBatchRegistryLookupResponse> => {
  try {
    const response = await axiosInstance.get<GetBatchRegistryLookupResponse>(
      API_ENDPOINTS.LOOKUP.BATCH_REGISTRY,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch batch registry lookup:', error);
    throw error;
  }
};

/**
 * Fetches a list of warehouses for lookup use.
 *
 * Supports filtering by:
 * - `locationTypeId`: optional ID to filter warehouses by location type
 * - `warehouseTypeId`: optional ID to filter warehouses by warehouse type
 * - `includeArchived`: whether to include archived warehouses (default: false)
 *
 * @param {GetWarehouseLookupFilters} filters - Optional query parameters to filter lookup results
 * @returns {Promise<GetWarehouseLookupResponse>} Response containing warehouse lookup items
 * @throws {Error} Rethrows any error encountered during API call
 */
const fetchWarehouseLookup = async (
  filters: GetWarehouseLookupFilters = {}
): Promise<GetWarehouseLookupResponse> => {
  try {
    const response = await axiosInstance.get<GetWarehouseLookupResponse>(
      API_ENDPOINTS.LOOKUP.WAREHOUSES,
      { params: filters }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch warehouse lookup:', error);
    throw error;
  }
};

/**
 * Fetches active lot adjustment types for lookup use.
 * By default, it excludes internal-use-only types such as manual stock insert/update.
 * These types are typically system-facing and not intended for regular user selection.
 *
 * This function is intended for use in forms or selection inputs where the user needs to choose
 * from available adjustment types (e.g., 'damaged', 'expired', 'lost', etc.).
 *
 * @param {LotAdjustmentLookupQueryParams} [params={}] - Optional query parameters to control lookup results.
 * @returns {Promise<LotAdjustmentTypeLookupResponse>} A promise that resolves to a list of formatted lookup options.
 * @throws Will throw if the HTTP request fails.
 */
const fetchLotAdjustmentTypeLookup = async (
  params: LotAdjustmentLookupQueryParams = {}
): Promise<LotAdjustmentTypeLookupResponse> => {
  try {
    const response = await axiosInstance.get<LotAdjustmentTypeLookupResponse>(
      API_ENDPOINTS.LOOKUP.LOT_ADJUSTMENT_TYPES,
      {
        params,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch lot adjustment lookup:', error);
    throw error;
  }
};

export const lookupService = {
  fetchBatchRegistryLookup,
  fetchWarehouseLookup,
  fetchLotAdjustmentTypeLookup,
};
