import { getRequest } from '@utils/apiRequest';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  AddressByCustomerLookupResponse,
  CustomerLookupQuery,
  CustomerLookupResponse,
  GetBatchRegistryLookupParams,
  GetBatchRegistryLookupResponse,
  GetWarehouseLookupResponse,
  LotAdjustmentLookupQueryParams,
  LotAdjustmentTypeLookupResponse,
  OrderTypeLookupQueryParams,
  OrderTypeLookupResponse,
} from '@features/lookup/state/lookupTypes';
import { buildQueryString } from '@utils/buildQueryString';

/**
 * Fetches lookup-compatible batch registry records.
 *
 * Supports filtering by batch type (e.g., 'product', 'packaging_material'),
 * exclusion of specific IDs, and pagination controls (limit/offset).
 *
 * Automatically constructs query string using `buildQueryString`.
 *
 * @param params - Optional filters and pagination options.
 * @returns A promise resolving to the batch registry lookup response.
 * @throws Rethrows any error encountered during the request.
 */
const fetchBatchRegistryLookup = async (
  params: GetBatchRegistryLookupParams = {}
): Promise<GetBatchRegistryLookupResponse> => {
  const queryString = buildQueryString(params);
  const url = `${API_ENDPOINTS.LOOKUPS.BATCH_REGISTRY}${queryString}`;

  try {
    return await getRequest<GetBatchRegistryLookupResponse>(url);
  } catch (error) {
    console.error('Failed to fetch batch registry lookup:', error);
    throw error;
  }
};

/**
 * Fetches a list of warehouses for lookup use.
 *
 * Optionally filters by `warehouseTypeId`.
 * Designed for populating dropdowns or filter menus where only a warehouse type is relevant.
 *
 * Constructs query string using `buildQueryString`.
 *
 * @param {string} [warehouseTypeId] - Optional ID to filter warehouses by warehouse type
 * @returns {Promise<GetWarehouseLookupResponse>} Response containing warehouse lookup items
 * @throws Rethrows any error encountered during the API call
 */
const fetchWarehouseLookup = async (
  warehouseTypeId?: string
): Promise<GetWarehouseLookupResponse> => {
  const params = warehouseTypeId ? { warehouseTypeId } : {};
  const queryString = buildQueryString(params);
  const url = `${API_ENDPOINTS.LOOKUPS.WAREHOUSES}${queryString}`;

  try {
    return await getRequest<GetWarehouseLookupResponse>(url);
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
 * Use `buildQueryString` to construct a clean query string.
 *
 * @param {LotAdjustmentLookupQueryParams} [params={}] - Optional query parameters to control lookup results.
 * @returns {Promise<LotAdjustmentTypeLookupResponse>} A promise that resolves to a list of formatted lookup options.
 * @throws Rethrows any HTTP error that occurs during the request.
 */
const fetchLotAdjustmentTypeLookup = async (
  params: LotAdjustmentLookupQueryParams = {}
): Promise<LotAdjustmentTypeLookupResponse> => {
  const queryString = buildQueryString(params);
  const url = `${API_ENDPOINTS.LOOKUPS.LOT_ADJUSTMENT_TYPES}${queryString}`;

  try {
    return await getRequest<LotAdjustmentTypeLookupResponse>(url);
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
    const queryString = buildQueryString(params);
    const url = `${API_ENDPOINTS.LOOKUPS.CUSTOMERS}${queryString}`;
    return await getRequest<CustomerLookupResponse>(url);
  } catch (error) {
    console.error('Failed to fetch customer lookup:', error);
    throw error;
  }
};

/**
 * Fetches all addresses associated with a given customer ID.
 *
 * Used in workflows such as
 * - Sales order creation
 * - Shipping/billing address selection
 * - Customer profile display
 *
 * Constructs query string using `buildQueryString` to safely include the customerId.
 *
 * @param {string} customerId - UUID of the customer to fetch addresses for
 * @returns {Promise<AddressByCustomerLookupResponse>} - API response containing an array of addresses
 * @throws Will rethrow the error if the request fails (caller must handle it)
 */
const fetchAddressesByCustomerId = async (
  customerId: string
): Promise<AddressByCustomerLookupResponse> => {
  const queryString = buildQueryString({ customerId });
  const url = `${API_ENDPOINTS.LOOKUPS.ADDRESSES_BY_CUSTOMER}${queryString}`;

  try {
    return await getRequest<AddressByCustomerLookupResponse>(url);
  } catch (error) {
    console.error('Failed to fetch addresses by customer ID:', error);
    throw error;
  }
};

/**
 * Fetches a list of order types from the server for use in lookup UIs.
 *
 * Supports optional keyword-based filtering via query parameters.
 *
 * @param params - Optional query parameters to filter the order types (e.g., { keyword: 'manufacturing' }).
 * @returns A promise resolving to an {@link OrderTypeLookupResponse}, containing metadata and a list of matching order types.
 * @throws Error if the network request fails or the response is invalid.
 */
const fetchOrderTypeLookup = async (
  params?: OrderTypeLookupQueryParams
): Promise<OrderTypeLookupResponse> => {
  const queryString = buildQueryString(params);
  const url = `${API_ENDPOINTS.LOOKUPS.ORDER_TYPES}${queryString}`;

  try {
    return await getRequest<OrderTypeLookupResponse>(url);
  } catch (error) {
    console.error('Failed to fetch order type lookup:', error);
    throw error;
  }
};

export const lookupService = {
  fetchBatchRegistryLookup,
  fetchWarehouseLookup,
  fetchLotAdjustmentTypeLookup,
  fetchCustomerLookup,
  fetchAddressesByCustomerId,
  fetchOrderTypeLookup,
};
