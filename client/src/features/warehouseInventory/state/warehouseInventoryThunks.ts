import { createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseInventoryService } from '@services/warehouseInventoryService';
import { dropdownService } from '@services/dropdownService';
import type { PaginatedResponse } from '@shared-types/api';
import type {
  FetchWarehouseInventoryArgs,
  FetchWarehouseInventoryItemSummaryParams,
  WarehouseInventoryItemSummary,
  WarehouseInventoryRecordsResponse,
  WarehouseInventorySummaryDetailsByItemIdResponse,
} from '@features/warehouseInventory/state/warehouseInventoryTypes';
import type { InventorySummaryDetailByItemIdParams } from '@features/inventoryShared/types/InventorySharedType';

/**
 * Redux thunk to fetch paginated warehouse inventory summary
 * including both SKU-level (products) and material-level records.
 *
 * @param {FetchWarehouseInventoryItemSummaryParams} params - Pagination and filter input (page, limit, itemType).
 * @returns {PaginatedResponse<WarehouseInventorySummary>} - Paginated inventory summary response.
 */
export const fetchWarehouseInventoryItemSummaryThunk = createAsyncThunk<
  PaginatedResponse<WarehouseInventoryItemSummary>,
  FetchWarehouseInventoryItemSummaryParams
>(
  'warehouseInventory/fetchWarehouseInventorySummary',
  async (params, thunkAPI) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventoryItemSummary(params);
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
  InventorySummaryDetailByItemIdParams,             // Arg type
  { rejectValue: string }                           // Optional: custom error type
>(
  'warehouseInventory/fetchSummaryByItemId',
  async (params, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventorySummaryDetailsByItemId(params);
    } catch (error) {
      return rejectWithValue('Failed to fetch warehouse inventory summary details.');
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
      return rejectWithValue(error.message || 'Failed to fetch warehouse inventory records.');
    }
  }
);

/**
 * Fetches the list of warehouses for the dropdown.
 * This should run only once when the component mounts.
 */
export const fetchWarehousesDropdownThunk = createAsyncThunk(
  'dropdown/fetchWarehouses',
  async (_, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchWarehousesForDropdown();
    } catch (error: any) {
      console.error('Error fetching warehouses:', error);
      return rejectWithValue(error.message || 'Failed to fetch warehouses');
    }
  }
);

/**
 * Fetches the list of products based on the selected warehouse.
 * This should run only when the user selects a warehouse.
 */
export const fetchProductsDropDownByWarehouseThunk = createAsyncThunk(
  'dropdown/fetchProductsByWarehouse',
  async ({ warehouseId }: { warehouseId: string }, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchProductsForWarehouseDropdown(
        warehouseId
      );
    } catch (error: any) {
      console.error('Error fetching products:', error);
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);
