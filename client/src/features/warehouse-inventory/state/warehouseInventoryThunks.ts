import { createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseInventoryService } from '../../../services';
import {
  WarehouseInventoryDetailsResponse,
  WarehouseInventoryResponse,
  WarehouseInventorySummaryResponse,
  WarehouseProductSummaryResponse,
} from './warehouseInventoryTypes.ts';

/**
 * Thunk to fetch warehouse inventories with pagination
 */
export const fetchWarehouseInventoriesThunk = createAsyncThunk<
  WarehouseInventoryResponse,
  { page: number; limit: number },
  { rejectValue: string }
>(
  'warehouseInventory/fetchAll',
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchAllWarehouseInventories(page, limit);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch warehouse inventories');
    }
  }
);

/**
 * Async thunk to fetch warehouse inventory summary.
 */
export const fetchWarehouseInventorySummaryThunk = createAsyncThunk<
  WarehouseInventorySummaryResponse,
  { summaryPage: number; summaryLimit: number; summaryStatus?: string },
  { rejectValue: string }
>(
  'warehouseInventory/fetchSummary',
  async ({ summaryPage, summaryLimit, summaryStatus }, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventorySummary(summaryPage, summaryLimit, summaryStatus);
    } catch (error) {
      console.error('Failed to fetch warehouse inventory summary:', error);
      return rejectWithValue('Failed to fetch warehouse inventory summary. Please try again.');
    }
  }
);

/**
 * Thunk to fetch warehouse product summary.
 *
 * @param {Object} params - Parameters for fetching data.
 * @param {string} params.warehouseId - The warehouse ID.
 * @param {number} params.page - Page number for pagination.
 * @param {number} params.limit - Number of records per page.
 */
export const fetchWarehouseProductSummaryThunk = createAsyncThunk<
  WarehouseProductSummaryResponse,
  { warehouseId: string; page: number; limit: number }
>(
  'warehouseProduct/fetchWarehouseProductSummary',
  async ({ warehouseId, page, limit }, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchWarehouseProductSummary(warehouseId, page, limit);
    } catch (error) {
      console.error('Failed to fetch warehouse products summary:', error);
      return rejectWithValue('Failed to fetch warehouse products summary. Please try again.');
    }
  }
);

export const fetchWarehouseInventoryDetailsThunk = createAsyncThunk<
  WarehouseInventoryDetailsResponse,
  { warehouseId: string; page?: number; limit?: number }
>(
  'warehouseInventory/fetchDetails',
  async ({ warehouseId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventoryDetails(warehouseId, page, limit);
    } catch (error) {
      console.error('Failed to fetch warehouse inventory details:', error);
      return rejectWithValue('Failed to fetch warehouse inventory details. Please try again.');
    }
  }
);
