import { getRequest } from '@utils/apiRequest';
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
 * Internally uses a shared API utility (`getRequest`) for consistent HTTP handling.
 *
 * @param params - Optional filters and pagination options.
 * @returns A promise resolving to the batch registry lookup response.
 * @throws Rethrows any error encountered during the request.
 */
const fetchBatchRegistryLookup = async (
  params: GetBatchRegistryLookupParams = {}
): Promise<GetBatchRegistryLookupResponse> => {
  try {
    return await getRequest<GetBatchRegistryLookupResponse>(
      API_ENDPOINTS.LOOKUPS.BATCH_REGISTRY,
      { params }
    );
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
 * Internally uses the `getRequest` utility for consistent error handling and logging.
 *
 * @param {GetWarehouseLookupFilters} filters - Optional query parameters to filter lookup results
 * @returns {Promise<GetWarehouseLookupResponse>} Response containing warehouse lookup items
 * @throws Rethrows any error encountered during the API call.
 */
const fetchWarehouseLookup = async (
  filters: GetWarehouseLookupFilters = {}
): Promise<GetWarehouseLookupResponse> => {
  try {
    return await getRequest<GetWarehouseLookupResponse>(
      API_ENDPOINTS.LOOKUPS.WAREHOUSES,
      { params: filters }
    );
  } catch (error) {
    console.error('Failed to fetch warehouse lookup:', error);
    throw error;
  }
};

/**
 * Fetches active lot adjustment types for lookup use.
 *
 * Excludes internal system-only types like "manual stock insert/update" by default.
 * Useful for user-facing forms requiring options such as "damaged", "lost", "expired", etc.
 *
 * Internally relies on the shared API utility (`getRequest`) for consistent network handling.
 *
 * @param {LotAdjustmentLookupQueryParams} [params={}] - Optional query parameters to control lookup results.
 * @returns {Promise<LotAdjustmentTypeLookupResponse>} A promise that resolves to a list of formatted lookup options.
 * @throws Rethrows any HTTP error that occurs during the request.
 */
const fetchLotAdjustmentTypeLookup = async (
  params: LotAdjustmentLookupQueryParams = {}
): Promise<LotAdjustmentTypeLookupResponse> => {
  try {
    return await getRequest<LotAdjustmentTypeLookupResponse>(
      API_ENDPOINTS.LOOKUPS.LOT_ADJUSTMENT_TYPES,
      { params }
    );
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
