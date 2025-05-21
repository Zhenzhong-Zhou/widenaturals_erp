import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  LocationInventoryQueryParams,
  LocationInventorySummaryDetailResponse,
  LocationInventorySummaryResponse,
} from './locationInventoryTypes';
import { locationInventoryService } from '@services/locationInventoryService.ts';
import type { InventorySummaryDetailByItemIdParams } from '@features/inventoryShared/types/InventorySharedType';

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
  LocationInventorySummaryResponse,  // Return type on success
  LocationInventoryQueryParams,      // Thunk input (params)
  { rejectValue: string }            // Return type on failure
>(
  'locationInventory/fetchInventorySummary',
  async (params, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventorySummary(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory summary');
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
  LocationInventorySummaryDetailResponse,                      // return type on success
  InventorySummaryDetailByItemIdParams,                       // argument type
  { rejectValue: string }                                     // optional error type
>(
  'locationInventory/fetchSummaryDetailByItemId',
  async (params, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventorySummaryByItemId(params);
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch inventory summary detail');
    }
  }
);
