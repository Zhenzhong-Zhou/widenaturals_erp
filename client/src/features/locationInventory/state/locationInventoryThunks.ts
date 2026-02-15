import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  FetchLocationInventoryArgs,
  LocationInventoryKpiSummaryResponse,
  LocationInventoryQueryParams,
  LocationInventoryRecordsResponse,
  LocationInventorySummaryDetailResponse,
  LocationInventorySummaryResponse,
} from './locationInventoryTypes';
import { locationInventoryService } from '@services/locationInventoryService';
import type {
  InventorySummaryDetailByItemIdParams,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';

/**
 * Thunk to fetch KPI summary for location inventory.
 *
 * @param {ItemType} [itemType] - Optional item type filter: 'product' or 'packaging_material'
 * @returns {Promise<LocationInventoryKpiSummaryResponse>} The KPI summary data.
 */
export const fetchLocationInventoryKpiSummaryThunk = createAsyncThunk<
  LocationInventoryKpiSummaryResponse,
  ItemType
>(
  'locationInventory/fetchKpiSummary',
  async (itemType, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventoryKpiSummary(
        itemType
      );
    } catch (error: any) {
      console.error('Failed to fetch KPI summary:', error);
      return rejectWithValue(error?.response?.data?.message || 'Unknown error');
    }
  }
);

/**
 * Thunk to fetch paginated and filtered location inventory summary data.
 *
 * This thunk calls the `locationInventoryService.fetchLocationInventorySummary` function
 * and returns a structured summary response. If an error occurs during the API request,
 * it returns a rejected value with a descriptive error message.
 *
 * @param {LocationInventoryQueryParams} params - Pagination, sorting, and filter parameters
 * @returns {Promise<LocationInventorySummaryResponse>} A response with summary data and pagination
 */
export const fetchLocationInventorySummaryThunk = createAsyncThunk<
  LocationInventorySummaryResponse, // Return type on success
  LocationInventoryQueryParams, // Thunk input (params)
  { rejectValue: string } // Return type on failure
>(
  'locationInventory/fetchInventorySummary',
  async (params, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventorySummary(
        params
      );
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch inventory summary'
      );
    }
  }
);

/**
 * Thunk to fetch location inventory summary details by item ID.
 *
 * @param {InventorySummaryDetailByItemIdParams} params - Includes itemId and optional pagination (page, limit).
 * @returns {Promise<LocationInventorySummaryDetailResponse>} - The fetched summary detail with pagination metadata.
 * @throws {string} Rejected with a message if the request fails.
 */
export const fetchLocationInventorySummaryByItemIdThunk = createAsyncThunk<
  LocationInventorySummaryDetailResponse, // return type on success
  InventorySummaryDetailByItemIdParams, // argument type
  { rejectValue: string } // optional error type
>(
  'locationInventory/fetchSummaryDetailByItemId',
  async (params, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventorySummaryByItemId(
        params
      );
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          'Failed to fetch inventory summary detail'
      );
    }
  }
);

/**
 * Thunk to fetch paginated location inventory records from the server.
 *
 * This thunk:
 * - Applies batch-type-specific filter cleanup via the service layer
 * - Uses the provided pagination and filter parameters
 * - Returns a structured response with records and pagination metadata
 * - Handles and propagates errors using `rejectWithValue`
 *
 * Usage:
 * dispatch(fetchLocationInventoryRecordsThunk({ pagination: { page: 1, limit: 20 }, filters }))
 *
 * @returns {Promise<LocationInventoryRecordsResponse>} Fulfilled with the fetched records or rejected with an error message
 */
export const fetchLocationInventoryRecordsThunk = createAsyncThunk<
  LocationInventoryRecordsResponse,
  FetchLocationInventoryArgs
>(
  'locationInventory/fetchRecords',
  async ({ pagination, filters, sortConfig = {} }, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventoryRecords(
        pagination,
        filters,
        sortConfig
      );
    } catch (error: any) {
      console.error('Thunk error fetching location inventory:', error);
      return rejectWithValue(
        error.message || 'Failed to fetch location inventory records.'
      );
    }
  }
);
