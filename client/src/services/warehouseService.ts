import type {
  WarehouseDetailsResponse,
  WarehouseResponse,
} from '@features/warehouse';
import { getRequest } from '@utils/apiRequest';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error/AppError';

/* =========================================================
 * Warehouses
 * ======================================================= */

/**
 * Fetch a paginated list of warehouses.
 *
 * Issues `GET /warehouses?page=&limit=`.
 *
 * Notes:
 * - Read-only operation
 * - Transport concerns handled centrally
 *
 * @param page - Page number (1-based)
 * @param limit - Page size
 *
 * @returns Paginated warehouse list
 * @throws {AppError}
 */
const fetchAllWarehouses = async (
  page: number,
  limit: number
): Promise<WarehouseResponse> => {
  if (page <= 0 || limit <= 0) {
    throw AppError.validation(
      'Invalid pagination parameters',
      { page, limit }
    );
  }
  
  const data = await getRequest<WarehouseResponse>(
    API_ENDPOINTS.ALL_WAREHOUSES,
    {
      policy: 'READ',
      config: {
        params: { page, limit },
      },
    }
  );
  
  // Defensive response validation
  if (!data || typeof data !== 'object') {
    throw AppError.server(
      'Invalid warehouse list response',
      { page, limit }
    );
  }
  
  return data;
};

/**
 * Fetch warehouse details by ID.
 *
 * Issues `GET /warehouses/:id`.
 *
 * @param warehouseId - Warehouse identifier
 *
 * @returns Warehouse details
 * @throws {AppError}
 */
const fetchWarehouseDetails = async (
  warehouseId: string
): Promise<WarehouseDetailsResponse> => {
  if (!warehouseId) {
    throw AppError.validation(
      'Warehouse ID is required'
    );
  }
  
  const endpoint =
    API_ENDPOINTS.WAREHOUSE_DETAILS.replace(
      ':id',
      warehouseId
    );
  
  const data = await getRequest<WarehouseDetailsResponse>(
    endpoint,
    { policy: 'READ' }
  );
  
  if (!data || typeof data !== 'object') {
    throw AppError.server(
      'Invalid warehouse details response',
      { warehouseId }
    );
  }
  
  return data;
};

/* =========================================================
 * Export
 * ======================================================= */

export const warehouseService = {
  fetchAllWarehouses,
  fetchWarehouseDetails,
};
