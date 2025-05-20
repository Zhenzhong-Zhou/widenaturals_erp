import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  WarehouseInventoryResponse,
  WarehouseInventorySummaryResponse,
  WarehouseItemSummaryResponse,
  WarehouseInventoryDetailsResponse,
  LotAdjustmentSinglePayload,
  BulkLotAdjustmentPayload,
  BulkInsertInventoryRequest,
  BulkInsertInventoryResponse,
  InsertInventoryRequestBody,
  FetchWarehouseItemSummaryParams,
} from '@features/warehouseInventory';
import { AppError } from '@utils/AppError';
import type {
  FetchWarehouseInventoryItemSummaryParams,
  InventoryRecordInsertResponse,
  WarehouseInventoryItemSummary,
  WarehouseInventorySummaryDetailsByItemIdResponse,
} from '@features/warehouseInventory/state';
import type { PaginatedResponse } from 'types/api';
import type {
  AvailableInventoryLotsResponse, FetchAvailableInventoryRequest,
} from '@features/inventoryAllocation';
import type { InventorySummaryDetailByItemIdParams } from '@features/inventoryShared/types/InventorySharedType';

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
      API_ENDPOINTS.WAREHOUSE_INVENTORY_SUMMARY,
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
export const fetchWarehouseInventorySummaryDetailsByItemId = async (
  params: InventorySummaryDetailByItemIdParams
): Promise<WarehouseInventorySummaryDetailsByItemIdResponse> => {
  const { itemId, page = 1, limit = 10 } = params;
  const endpoint = API_ENDPOINTS.WAREHOUSE_INVENTORY_SUMMARY_DETAIL.replace(':itemId', itemId);
  
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
 * Fetches all warehouse inventories with pagination.
 * @param {number} page - The current page number (default: 1)
 * @param {number} limit - The number of records per page (default: 10)
 * @returns {Promise<WarehouseInventoryResponse>} Warehouse inventory response
 * @throws {AppError} If the API request fails
 */
const fetchAllWarehouseInventories = async (
  page: number = 1,
  limit: number = 10
): Promise<WarehouseInventoryResponse> => {
  try {
    const response = await axiosInstance.get<WarehouseInventoryResponse>(
      `${API_ENDPOINTS.ALL_WAREHOUSE_INVENTORIES}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse inventories:', error);

    // Throw a custom error with a meaningful message
    throw new AppError(
      'Failed to fetch warehouse inventories. Please try again.'
    );
  }
};

/**
 * Fetches the warehouse inventory summary from the backend.
 *
 * @param {number} page - The page number for pagination (default: 1).
 * @param {number} limit - The number of records per page (default: 10).
 * @param {string} [status] - Optional filter by warehouse status (`active`, `inactive`, `all`).
 * @returns {Promise<WarehouseInventorySummaryResponse>} - The warehouse inventory summary data.
 */
const fetchWarehouseInventorySummary = async (
  page: number = 1,
  limit: number = 10,
  status?: string // Optional status (default is no filter)
): Promise<WarehouseInventorySummaryResponse> => {
  try {
    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      throw new Error('Page and limit must be positive numbers.');
    }

    // Construct API URL with query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Only add status to the request if it's provided (avoids unnecessary filtering)
    if (status) {
      queryParams.append('status', status);
    }

    const response = await axiosInstance.get<WarehouseInventorySummaryResponse>(
      `${API_ENDPOINTS.WAREHOUSE_INVENTORIES_SUMMARY}?${queryParams.toString()}`
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse inventory summary:', error);

    // Return a safe default response or throw a custom error
    throw new Error(
      'Failed to fetch warehouse inventory summary. Please try again later.'
    );
  }
};

/**
 * Fetches the warehouse item summary from the backend.
 *
 * @param {FetchWarehouseItemSummaryParams} params - Parameters for fetching item summary.
 * @returns {Promise<WarehouseItemSummaryResponse>} - The warehouse item summary data.
 */
const fetchWarehouseItemSummary = async ({
  warehouseId,
  itemSummaryPage = 1,
  itemSummaryLimit = 10,
}: FetchWarehouseItemSummaryParams): Promise<WarehouseItemSummaryResponse> => {
  try {
    const endpoint = API_ENDPOINTS.WAREHOUSE_ITEMS_SUMMARY.replace(
      ':id',
      warehouseId
    );

    const response = await axiosInstance.get<WarehouseItemSummaryResponse>(
      `${endpoint}?page=${itemSummaryPage}&limit=${itemSummaryLimit}`
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse item summary:', error);
    throw new AppError(
      'Failed to fetch warehouse item summary. Please try again later.'
    );
  }
};

const fetchWarehouseInventoryDetails = async (
  warehouseId: string,
  page: number = 1,
  limit: number = 10
): Promise<WarehouseInventoryDetailsResponse> => {
  try {
    const endpoint = API_ENDPOINTS.WAREHOUSE_INVENTORY_DETAILS.replace(
      ':id',
      warehouseId
    );
    const response = await axiosInstance.get<WarehouseInventoryDetailsResponse>(
      `${endpoint}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse inventory details:', error);
    throw new AppError(
      'Failed to fetch warehouse inventory details. Please try again later.'
    );
  }
};

/**
 * Adjusts the quantity of a warehouse inventory lot.
 * @param {string} warehouseInventoryLotId - The warehouse inventory lot ID to update.
 * @param {Object} payload - The adjustment details.
 * @param {string} payload.adjustment_type_id - The type of adjustment.
 * @param {number} payload.adjusted_quantity - The quantity change.
 * @param {string} payload.comments - Additional comments.
 */
const adjustSingleWarehouseInventoryLotQty = async (
  warehouseInventoryLotId: string,
  payload: LotAdjustmentSinglePayload
): Promise<LotAdjustmentSinglePayload> => {
  const endpoint = API_ENDPOINTS.WAREHOUSE_INVENTORY_LOT_SINGLE_ADJUST.replace(
    ':id',
    warehouseInventoryLotId
  );
  const response = await axiosInstance.patch<LotAdjustmentSinglePayload>(
    endpoint,
    payload
  );
  return response.data;
};

const bulkAdjustWarehouseInventoryLotQty = async (
  adjustments: BulkLotAdjustmentPayload
) => {
  try {
    const response = await axiosInstance.patch(
      API_ENDPOINTS.WAREHOUSE_INVENTORY_LOT_BULK_ADJUST,
      adjustments
    );
    return response.data;
  } catch (error) {
    console.error('Failed to adjust warehouse inventory:', error);
    throw error;
  }
};

const bulkInsertInventory = async (
  requestData: BulkInsertInventoryRequest
): Promise<BulkInsertInventoryResponse> => {
  try {
    const response = await axiosInstance.post<BulkInsertInventoryResponse>(
      API_ENDPOINTS.WAREHOUSE_INVENTORY_BULK_INSERT,
      requestData
    );
    return response.data;
  } catch (error) {
    console.error('Error inserting inventory:', error);
    throw new AppError('Failed to insert inventory records.');
  }
};

const getInsertedInventoryRecords = async (
  requestData: InsertInventoryRequestBody
): Promise<InventoryRecordInsertResponse | null> => {
  try {
    const response = await axiosInstance.post<InventoryRecordInsertResponse>(
      API_ENDPOINTS.WAREHOUSE_INVENTORY_LOT_INSERT_RESPONSE,
      requestData
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory response:', error);
    return null;
  }
};

/**
 * Fetches available inventory lots for a specific inventory item.
 *
 * @param params - Object containing `inventoryId` as a path param, `warehouseId` and optional `strategy` as query params.
 * @returns A promise that resolves to an `AvailableInventoryLotsResponse` object or `null` if an error occurs.
 */
export const fetchAvailableInventoryLots = async (
  params: FetchAvailableInventoryRequest
): Promise<AvailableInventoryLotsResponse | null> => {
  try {
    const endpoint = API_ENDPOINTS.WAREHOUSE_INVENTORY_LOT_INVENTORY_AVAILABLE.replace(
      ':inventoryId',
      params.inventoryId
    );
    const response = await axiosInstance.get<AvailableInventoryLotsResponse>(endpoint, {
      params: {
        warehouseId: params.warehouseId,
        strategy: params.strategy,
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching available inventory lots:', error);
    return null;
  }
};

// Export the service
export const warehouseInventoryService = {
  fetchWarehouseInventoryItemSummary,
  fetchWarehouseInventorySummaryDetailsByItemId,
  fetchAllWarehouseInventories,
  fetchWarehouseInventorySummary,
  fetchWarehouseItemSummary,
  fetchWarehouseInventoryDetails,
  adjustSingleWarehouseInventoryLotQty,
  bulkAdjustWarehouseInventoryLotQty,
  bulkInsertInventory,
  getInsertedInventoryRecords,
  fetchAvailableInventoryLots
};
