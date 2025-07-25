import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  LocationInventoryFilters,
  LocationInventoryKpiSummaryResponse,
  LocationInventoryQueryParams,
  LocationInventoryRecordsResponse,
  LocationInventorySummaryDetailResponse,
  LocationInventorySummaryResponse,
} from '@features/locationInventory/state';
import { AppError } from '@utils/AppError';
import type {
  InventorySummaryDetailByItemIdParams,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';
import { buildLocationInventoryFilters } from '@utils/filters/buildLocationInventoryFilters';
import type { PaginationParams, SortConfig } from '@shared-types/api.ts';

/**
 * Fetches KPI summary for location inventory.
 *
 * @param {ItemType} [itemType] - Optional filter by item type ('product' or 'packaging_material').
 * @returns {Promise<LocationInventoryKpiSummaryResponse>} A promise resolving to the KPI summary response.
 * @throws Will throw an error if the API request fails.
 */
const fetchLocationInventoryKpiSummary = async (
  itemType?: ItemType
): Promise<LocationInventoryKpiSummaryResponse> => {
  try {
    const response =
      await axiosInstance.get<LocationInventoryKpiSummaryResponse>(
        API_ENDPOINTS.LOCATION_INVENTORY.KPI_SUMMARY,
        {
          params: itemType ? { itemType } : {},
        }
      );

    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch location inventoryKpiSummary');
  }
};

/**
 * Fetch all inventory summaries (product or material) with pagination, filters, and sorting.
 * @param {LocationInventoryQueryParams} params - Filter and pagination options
 * @returns {Promise<LocationInventorySummaryResponse>} The response containing summary data.
 */
export const fetchLocationInventorySummary = async (
  params: LocationInventoryQueryParams
): Promise<LocationInventorySummaryResponse> => {
  try {
    const response = await axiosInstance.get<LocationInventorySummaryResponse>(
      API_ENDPOINTS.LOCATION_INVENTORY.SUMMARY,
      { params }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching inventory summary:', error);
    throw new AppError(
      error.response?.data?.message || 'Failed to fetch inventory summary'
    );
  }
};

/**
 * Fetches location inventory summary detail records by item ID.
 *
 * @param {InventorySummaryDetailByItemIdParams} params - The item ID and optional pagination values.
 * @returns {Promise<LocationInventorySummaryDetailResponse>} A promise resolving to inventory summary details and pagination metadata.
 * @throws Will throw an error if the request fails.
 */
export const fetchLocationInventorySummaryByItemId = async (
  params: InventorySummaryDetailByItemIdParams
): Promise<LocationInventorySummaryDetailResponse> => {
  const { itemId, page = 1, limit = 10 } = params;
  const endpoint = API_ENDPOINTS.LOCATION_INVENTORY.SUMMARY_DETAIL(itemId);

  try {
    const response =
      await axiosInstance.get<LocationInventorySummaryDetailResponse>(
        endpoint,
        { params: { page, limit } }
      );

    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch location inventory summary detail.');
  }
};

/**
 * Fetches paginated and filtered location inventory records from the server.
 *
 * Accepts optional query parameters including pagination, sorting, and filters.
 * Filters will be sanitized (e.g., based on batchType: product vs. material) before being sent.
 *
 * @param {PaginationParams} pagination - Pagination configuration (page and limit)
 * @param {LocationInventoryFilters} rawFilters - Raw filter input to be cleaned and applied
 * @param {SortConfig} rawSortConfig - Sorting options (sortBy field and sortOrder direction)
 * @returns {Promise<LocationInventoryRecordsResponse>} - Paginated inventory record result
 */
const fetchLocationInventoryRecords = async (
  pagination: PaginationParams,
  rawFilters: LocationInventoryFilters,
  rawSortConfig: SortConfig = {}
): Promise<LocationInventoryRecordsResponse> => {
  const { page = 1, limit = 10 } = pagination;
  const filters = buildLocationInventoryFilters(rawFilters);
  const { sortBy, sortOrder } = rawSortConfig;

  try {
    const response = await axiosInstance.get<LocationInventoryRecordsResponse>(
      API_ENDPOINTS.LOCATION_INVENTORY.ALL_RECORDS,
      {
        params: {
          page,
          limit,
          ...filters,
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching location inventory records:', error);
    throw new Error('Failed to fetch location inventory records.');
  }
};

export const locationInventoryService = {
  fetchLocationInventoryKpiSummary,
  fetchLocationInventorySummary,
  fetchLocationInventorySummaryByItemId,
  fetchLocationInventoryRecords,
};
