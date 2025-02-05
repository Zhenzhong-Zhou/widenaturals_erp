import { createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseInventoryService } from '../../../services';
import { WarehouseInventoryResponse, WarehouseInventorySummaryResponse } from './warehouseInventoryTypes.ts';

/**
 * Thunk to fetch warehouse inventories with pagination
 */
export const fetchWarehouseInventories = createAsyncThunk<
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
