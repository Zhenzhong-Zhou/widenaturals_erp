import type {
  WarehouseDetailsResponse,
  WarehouseResponse,
} from '@features/warehouse';
import { AppError } from '@utils/error';
import { getRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';

/* =========================================================
 * Warehouses
 * ======================================================= */

/**
 * Fetch a paginated list of warehouses.
 *
 * GET /warehouses?page=&limit=
 *
 * - Read-only
 * - Idempotent
 * - Adds pagination via query params
 */
const fetchAllWarehouses = async (
  page = 1,
  limit = 20
): Promise<WarehouseResponse> => {
  if (page <= 0 || limit <= 0) {
    throw AppError.validation(
      'Invalid pagination parameters',
      { page, limit }
    );
  }
  
  return getRequest<WarehouseResponse>(
    API_ENDPOINTS.WAREHOUSES.ALL_RECORDS,
    {
      policy: 'READ',
      config: {
        params: { page, limit },
      },
    }
  );
};

/**
 * Fetch warehouse details by ID.
 *
 * GET /warehouses/:warehouseId/details
 *
 * @param warehouseId - Warehouse UUID
 */
const fetchWarehouseDetails = async (
  warehouseId: string
): Promise<WarehouseDetailsResponse> => {
  if (!warehouseId) {
    throw AppError.validation('Warehouse ID is required');
  }
  
  return getRequest<WarehouseDetailsResponse>(
    API_ENDPOINTS.WAREHOUSES.WAREHOUSE_DETAILS(warehouseId),
    { policy: 'READ' }
  );
};

/* =========================================================
 * Public API
 * ======================================================= */

export const warehouseService = {
  fetchAllWarehouses,
  fetchWarehouseDetails,
};
