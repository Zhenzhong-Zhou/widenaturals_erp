/**
 * @file warehouseService.ts
 *
 * API service for the Warehouse domain.
 * All HTTP calls to warehouse endpoints are centralised here.
 */

import type {
  PaginatedWarehouseListApiResponse,
  WarehouseDetailApiResponse,
  WarehouseQueryParams,
} from '@features/warehouse/state/warehouseTypes';
import { buildQueryString, flattenListQueryParams } from '@utils/query';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';

/**
 * Fetch a paginated list of warehouses with optional filters and sorting.
 *
 * READ-only operation.
 */
const fetchPaginatedWarehouses = async (
  params: WarehouseQueryParams
): Promise<PaginatedWarehouseListApiResponse> => {
  const flatParams = flattenListQueryParams(params, []);
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.WAREHOUSES.ALL_RECORDS}${queryString}`;
  
  return getRequest<PaginatedWarehouseListApiResponse>(url, {
    policy: 'READ',
  });
};

/**
 * Fetch full warehouse detail by id.
 *
 * READ-only operation.
 */
const fetchWarehouseById = async (
  warehouseId: string
): Promise<WarehouseDetailApiResponse> => {
  const url = API_ENDPOINTS.WAREHOUSES.DETAIL(warehouseId);
  
  return getRequest<WarehouseDetailApiResponse>(url, {
    policy: 'READ',
  });
};

export const warehouseService = {
  fetchPaginatedWarehouses,
  fetchWarehouseById,
};
