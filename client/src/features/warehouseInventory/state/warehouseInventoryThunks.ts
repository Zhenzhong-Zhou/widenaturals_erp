import { createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseInventoryService } from '@services/warehouseInventoryService';
import type { PaginatedResponse } from '@shared-types/api';
import type {
  FetchWarehouseInventoryArgs,
  FetchWarehouseInventoryItemSummaryParams,
  WarehouseInventoryItemSummary,
  WarehouseInventoryRecordsResponse,
  WarehouseInventorySummaryDetailsByItemIdResponse,
} from '@features/warehouseInventory/state/warehouseInventoryTypes';
import type {
  CreateInventoryRecordsRequest,
  CreateInventoryRecordsResponse,
  InventorySummaryDetailByItemIdParams,
} from '@features/inventoryShared/types/InventorySharedType';

/**
 * Redux thunk to fetch paginated warehouse inventory summary
 * including both SKU-level (products) and material-level records.
 *
 * @param {FetchWarehouseInventoryItemSummaryParams} params - Pagination and filter input (page, limit, itemType).
 * @returns {PaginatedResponse<WarehouseInventoryItemSummary>} - Paginated inventory summary response.
 */
export const fetchWarehouseInventoryItemSummaryThunk = createAsyncThunk<
  PaginatedResponse<WarehouseInventoryItemSummary>,
  FetchWarehouseInventoryItemSummaryParams
>(
  'warehouseInventory/fetchWarehouseInventorySummary',
  async (params, thunkAPI) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventoryItemSummary(
        params
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

/**
 * Redux thunk to fetch paginated warehouse inventory summary details for a specific item ID (SKU or material).
 *
 * @param {InventorySummaryDetailByItemIdParams} params - Query parameters including itemId, page, and limit.
 * @returns {Promise<WarehouseInventorySummaryDetailsByItemIdResponse>} - Paginated inventory summary response.
 */
export const fetchWarehouseInventorySummaryByItemIdThunk = createAsyncThunk<
  WarehouseInventorySummaryDetailsByItemIdResponse, // Return type
  InventorySummaryDetailByItemIdParams, // Arg type
  { rejectValue: string } // Optional: custom error type
>(
  'warehouseInventory/fetchSummaryByItemId',
  async (params, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventorySummaryDetailsByItemId(
        params
      );
    } catch (error) {
      return rejectWithValue(
        'Failed to fetch warehouse inventory summary details.'
      );
    }
  }
);

/**
 * Thunk to fetch paginated warehouse inventory records from the server.
 *
 * This thunk:
 * - Applies batch-type-specific filter cleanup via the service layer
 * - Uses the provided pagination and filter parameters
 * - Returns a structured response with records and pagination metadata
 * - Handles and propagates errors using `rejectWithValue`
 *
 * Usage:
 * dispatch(fetchWarehouseInventoryRecordsThunk({ pagination: { page: 1, limit: 20 }, filters }))
 *
 * @returns {Promise<WarehouseInventoryRecordsResponse>} Fulfilled with the fetched records or rejected with an error message
 */
export const fetchWarehouseInventoryRecordsThunk = createAsyncThunk<
  WarehouseInventoryRecordsResponse,
  FetchWarehouseInventoryArgs
>(
  'warehouseInventory/fetchRecords',
  async ({ pagination, filters, sortConfig = {} }, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventoryRecords(
        pagination,
        filters,
        sortConfig
      );
    } catch (error: any) {
      console.error('Thunk error fetching warehouse inventory:', error);
      return rejectWithValue(
        error.message || 'Failed to fetch warehouse inventory records.'
      );
    }
  }
);

/**
 * Thunk to create warehouse and/or location inventory records.
 *
 * This thunk dispatches an API call to create new inventory records in both
 * the warehouse and location inventory tables. It handles loading, success,
 * and error states automatically via Redux Toolkit's `createAsyncThunk`.
 *
 * @param payload - The request payload containing inventory records to insert.
 * @returns A promise resolving to the API response or a rejection message.
 */
export const createWarehouseInventoryRecordsThunk = createAsyncThunk<
  CreateInventoryRecordsResponse, // Return type
  CreateInventoryRecordsRequest, // Payload type
  { rejectValue: string } // Rejection type
>(
  'warehouseInventory/createWarehouseInventoryRecords',
  async (payload, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.createWarehouseInventoryRecords(
        payload
      );
    } catch (error: any) {
      console.error('Error creating warehouse inventory records:', error);
      return rejectWithValue(
        error?.message ?? 'Failed to create inventory records'
      );
    }
  }
);
