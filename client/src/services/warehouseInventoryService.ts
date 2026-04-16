/**
 * @file warehouseInventoryService.ts
 *
 * API service for the Warehouse Inventory domain.
 * All HTTP calls to warehouse inventory endpoints are centralised here.
 */

import type {
  CreateWarehouseInventoryRequest, CreateWarehouseInventoryResponse,
  PaginatedWarehouseInventoryApiResponse,
  WarehouseInventoryQueryParams,
} from '@features/warehouseInventory';
import { buildQueryString, flattenListQueryParams } from '@utils/query';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, postRequest } from '@utils/http';

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

/**
 * Create one or more warehouse inventory records.
 *
 * Issues:
 *   POST /:warehouseId/inventory
 *
 * Notes:
 * - Accepts a bulk payload with 1–200 records.
 * - Errors are propagated as normalized AppError instances by the transport layer.
 *
 * @param warehouseId - Target warehouse UUID.
 * @param payload - Inventory records to create.
 * @returns API response containing the created inventory record(s).
 * @throws {AppError} When the request fails.
 */
const createWarehouseInventory = async (
  warehouseId: string,
  payload: CreateWarehouseInventoryRequest
): Promise<CreateWarehouseInventoryResponse> => {
  return postRequest<CreateWarehouseInventoryRequest, CreateWarehouseInventoryResponse>(
    API_ENDPOINTS.WAREHOUSE_INVENTORY.CREATE(warehouseId),
    payload
  );
};

export const warehouseInventoryService = {
  fetchPaginatedWarehouseInventory,
  createWarehouseInventory,
};
