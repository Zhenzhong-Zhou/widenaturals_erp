import { getRequest } from '@utils/apiRequest';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  CustomerLookupQuery,
  CustomerLookupResponse,
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

/**
 * Fetches customer lookup data from the backend using optional keyword search and pagination.
 *
 * This function is typically used to populate dropdowns, autocomplete fields,
 * or other UI components that require customer selection.
 *
 * @param params - Optional query filters:
 *   - `keyword`: Partial text to search customers by name, email, or phone.
 *   - `limit`: Number of records to return (defaults to backend logic).
 *   - `offset`: Offset for pagination (useful for "load more" patterns).
 *
 * @returns A promise resolving to a structured lookup response containing
 *          customer items and pagination metadata.
 *
 * @example
 * const result = await fetchCustomerLookup({ keyword: 'john', limit: 10 });
 * // result = { items: [...], offset: 0, limit: 10, hasMore: true, loadMore: true }
 */
const fetchCustomerLookup = async (
  params?: CustomerLookupQuery
): Promise<CustomerLookupResponse> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.keyword) searchParams.append('keyword', params.keyword);
    if (params?.limit != null) searchParams.append('limit', params.limit.toString());
    if (params?.offset != null) searchParams.append('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    const url = `${API_ENDPOINTS.LOOKUPS.CUSTOMERS}${queryString ? `?${queryString}` : ''}`;
    
    return await getRequest<CustomerLookupResponse>(url);
  } catch (error) {
    console.error('Failed to fetch customer lookup:', error);
    throw error; // rethrow for global error handlers or React Query
  }
};

export const lookupService = {
  fetchBatchRegistryLookup,
  fetchWarehouseLookup,
  fetchLotAdjustmentTypeLookup,
  fetchCustomerLookup,
};
