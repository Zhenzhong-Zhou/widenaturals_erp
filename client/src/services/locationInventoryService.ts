import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  LocationInventoryFilters,
  LocationInventoryKpiSummaryResponse,
  LocationInventoryQueryParams,
  LocationInventoryRecordsResponse,
  LocationInventorySummaryDetailResponse,
  LocationInventorySummaryResponse,
} from '@features/locationInventory/state';
import type {
  InventorySummaryDetailByItemIdParams,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';
import type { PaginationParams, SortConfig } from '@shared-types/api';
import { buildLocationInventoryFilters } from '@utils/filters/buildLocationInventoryFilters';
import { getRequest } from '@utils/http';
import { AppError } from '@utils/error';

/**
 * Fetches KPI summary for location inventory.
 *
 * Issues:
 *   GET /location-inventory/kpi-summary
 *
 * @param itemType - Optional filter by item type.
 * @returns KPI summary data.
 * @throws {AppError} When the request fails.
 */
const fetchLocationInventoryKpiSummary = async (
  itemType?: ItemType
): Promise<LocationInventoryKpiSummaryResponse> => {
  return getRequest<LocationInventoryKpiSummaryResponse>(
    API_ENDPOINTS.LOCATION_INVENTORY.KPI_SUMMARY,
    {
      config: {
        params: itemType ? { itemType } : {},
      },
    }
  );
};

/* =========================================================
 * Location Inventory Summary
 * ======================================================= */

/**
 * Fetches paginated inventory summaries for a location.
 *
 * Issues:
 *   GET /location-inventory/summary
 *
 * @param params - Query filters, pagination, and sorting options.
 * @returns Inventory summary response.
 * @throws {AppError} When the request fails or response is invalid.
 */
const fetchLocationInventorySummary = async (
  params: LocationInventoryQueryParams
): Promise<LocationInventorySummaryResponse> => {
  const data = await getRequest<LocationInventorySummaryResponse>(
    API_ENDPOINTS.LOCATION_INVENTORY.SUMMARY,
    {
      config: { params },
    }
  );

  // Domain invariant: response must exist
  if (!data || typeof data !== 'object') {
    throw AppError.server('Invalid location inventory summary response', {
      params,
    });
  }

  return data;
};

/**
 * Fetches inventory summary detail records by item ID.
 *
 * Issues:
 *   GET /location-inventory/summary/:itemId
 *
 * @param params - Item ID and pagination options.
 * @returns Inventory summary detail response.
 * @throws {AppError} When the request fails.
 */
const fetchLocationInventorySummaryByItemId = async (
  params: InventorySummaryDetailByItemIdParams
): Promise<LocationInventorySummaryDetailResponse> => {
  const { itemId, page = 1, limit = 10 } = params;

  return getRequest<LocationInventorySummaryDetailResponse>(
    API_ENDPOINTS.LOCATION_INVENTORY.SUMMARY_DETAIL(itemId),
    {
      config: {
        params: { page, limit },
      },
    }
  );
};

/**
 * Fetches paginated and filtered location inventory records.
 *
 * Issues:
 *   GET /location-inventory/records
 *
 * @param pagination - Pagination configuration.
 * @param rawFilters - Raw filter input.
 * @param rawSortConfig - Sorting configuration.
 * @returns Paginated inventory records.
 * @throws {AppError} When the request fails.
 */
const fetchLocationInventoryRecords = async (
  pagination: PaginationParams,
  rawFilters: LocationInventoryFilters,
  rawSortConfig: SortConfig = {}
): Promise<LocationInventoryRecordsResponse> => {
  const { page = 1, limit = 10 } = pagination;
  const filters = buildLocationInventoryFilters(rawFilters);
  const { sortBy, sortOrder } = rawSortConfig;

  return getRequest<LocationInventoryRecordsResponse>(
    API_ENDPOINTS.LOCATION_INVENTORY.ALL_RECORDS,
    {
      config: {
        params: {
          page,
          limit,
          ...filters,
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        },
      },
    }
  );
};

export const locationInventoryService = {
  fetchLocationInventoryKpiSummary,
  fetchLocationInventorySummary,
  fetchLocationInventorySummaryByItemId,
  fetchLocationInventoryRecords,
};
