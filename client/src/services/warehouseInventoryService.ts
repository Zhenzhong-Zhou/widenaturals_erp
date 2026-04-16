/**
 * @file warehouseInventoryService.ts
 *
 * API service for the Warehouse Inventory domain.
 * All HTTP calls to warehouse inventory endpoints are centralised here.
 */

import type {
  PaginatedWarehouseInventoryApiResponse,
  WarehouseInventoryQueryParams,
} from '@features/warehouseInventory';
import { buildQueryString, flattenListQueryParams } from '@utils/query';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';

/**
 * Fetch a paginated list of warehouse inventory records with optional filters and sorting.
 *
 * READ-only operation.
 */
const fetchPaginatedWarehouseInventory = async (
  params: WarehouseInventoryQueryParams
): Promise<PaginatedWarehouseInventoryApiResponse> => {
  const { warehouseId, ...queryParams } = params;
  const flatParams = flattenListQueryParams(queryParams, []);
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.WAREHOUSE_INVENTORY.ALL_RECORDS(warehouseId)}${queryString}`;
  
  return getRequest<PaginatedWarehouseInventoryApiResponse>(url, {
    policy: 'READ',
  });
};

export const warehouseInventoryService = {
  fetchPaginatedWarehouseInventory,
};
