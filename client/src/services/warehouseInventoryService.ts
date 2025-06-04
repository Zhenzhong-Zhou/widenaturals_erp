import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  FetchWarehouseInventoryItemSummaryParams,
  WarehouseInventoryFilters,
  WarehouseInventoryItemSummary, WarehouseInventoryRecordsResponse,
  WarehouseInventorySummaryDetailsByItemIdResponse,
} from '@features/warehouseInventory/state';
import type { PaginatedResponse, PaginationParams, SortConfig } from '@shared-types/api';
import type { CreateInventoryRecordsRequest, CreateInventoryRecordsResponse, InventorySummaryDetailByItemIdParams } from '@features/inventoryShared/types/InventorySharedType';
import { buildWarehouseInventoryFilters } from '@utils/filters/buildWarehouseInventoryFilters';

/**
 * Fetches paginated warehouse inventory summary (products and/or materials).
 *
 * @param {FetchWarehouseInventoryItemSummaryParams} params - Pagination and filter parameters.
 * @returns {Promise<PaginatedResponse<WarehouseInventoryItemSummary>>} - Typed paginated inventory response.
 * @throws {AppError} If the API request fails.
 */
const fetchWarehouseInventoryItemSummary = async (
  params: FetchWarehouseInventoryItemSummaryParams
): Promise<PaginatedResponse<WarehouseInventoryItemSummary>> => {
  try {
    const response = await axiosInstance.get<PaginatedResponse<WarehouseInventoryItemSummary>>(
      API_ENDPOINTS.WAREHOUSE_INVENTORY.SUMMARY,
      { params }
    );
    
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch warehouse inventory item summary.');
  }
};

/**
 * Fetch paginated warehouse inventory summary details by item ID.
 *
 * @param {InventorySummaryDetailByItemIdParams} params - Query parameters including itemId, page, and limit.
 * @returns {Promise<WarehouseInventorySummaryDetailsByItemIdResponse>} - API response with paginated data.
 * @throws {AppError} On network or API failure.
 */
const fetchWarehouseInventorySummaryDetailsByItemId = async (
  params: InventorySummaryDetailByItemIdParams
): Promise<WarehouseInventorySummaryDetailsByItemIdResponse> => {
  const { itemId, page = 1, limit = 10 } = params;
  const endpoint = API_ENDPOINTS.WAREHOUSE_INVENTORY.SUMMARY_DETAIL(itemId);
  
  try {
    const response = await axiosInstance.get(endpoint, {
      params: { page, limit },
    });
    
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch warehouse inventory summary details.');
  }
};

/**
 * Fetches paginated and filtered warehouse inventory records from the server.
 *
 * Accepts optional query parameters including pagination, sorting, and filters.
 * Filters will be sanitized (e.g., based on batchType: product vs. material) before being sent.
 *
 * @param {PaginationParams} pagination - Pagination configuration (page and limit)
 * @param {WarehouseInventoryFilters} rawFilters - Raw filter input to be cleaned and applied
 * @param {SortConfig} rawSortConfig - Sorting options (sortBy field and sortOrder direction)
 * @returns {Promise<WarehouseInventoryRecordsResponse>} - Paginated inventory record result
 */
const fetchWarehouseInventoryRecords = async (
  pagination: PaginationParams,
  rawFilters: WarehouseInventoryFilters,
  rawSortConfig: SortConfig = {}
): Promise<WarehouseInventoryRecordsResponse> => {
  const { page = 1, limit = 10 } = pagination;
  const filters = buildWarehouseInventoryFilters(rawFilters);
  const { sortBy, sortOrder } = rawSortConfig;
  
  try {
    const response = await axiosInstance.get<WarehouseInventoryRecordsResponse>(
      API_ENDPOINTS.WAREHOUSE_INVENTORY.ALL_RECORDS,
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
    console.error('Error fetching warehouse inventory records:', error);
    throw new Error('Failed to fetch warehouse inventory records.');
  }
};

/**
 * Sends a request to create warehouse and/or location inventory records.
 *
 * @param {CreateInventoryRecordsRequest} payload - The request payload containing inventory records.
 * @returns {Promise<CreateInventoryRecordsResponse>} The API response containing created inventory records.
 * @throws Will throw an error if the request fails (to be caught by the caller).
 */
const createWarehouseInventoryRecords = async (
  payload: CreateInventoryRecordsRequest
): Promise<CreateInventoryRecordsResponse> => {
  try {
    const response = await axiosInstance.post<CreateInventoryRecordsResponse>(
      '/warehouse-inventory',
      payload
    );
    return response.data;
  } catch (error) {
    // You can enhance this by transforming the error or using a centralized error handler
    console.error('Failed to create inventory records:', error);
    throw error;
  }
};

// Export the service
export const warehouseInventoryService = {
  fetchWarehouseInventoryItemSummary,
  fetchWarehouseInventorySummaryDetailsByItemId,
  fetchWarehouseInventoryRecords,
  createWarehouseInventoryRecords,
};
