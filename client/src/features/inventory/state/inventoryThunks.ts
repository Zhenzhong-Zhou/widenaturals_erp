import { createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryService } from '../../../services';
import { InventoryResponse, InventorySummaryResponse } from './inventoryTypes.ts';

/**
 * Fetch all inventories with pagination, sorting, and error handling.
 */
export const fetchAllInventories = createAsyncThunk<
  InventoryResponse,
  { page: number; limit: number; sortBy?: string; sortOrder?: string },
  { rejectValue: string }
>(
  'inventory/fetchAllInventories',
  async (
    { page, limit, sortBy = 'created_at', sortOrder = 'DESC' },
    { rejectWithValue }
  ) => {
    try {
      return await inventoryService.fetchAllInventories(
        page,
        limit,
        sortBy,
        sortOrder
      );
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventories');
    }
  }
);

/**
 * Thunk to fetch paginated inventory summary.
 *
 * @param {Object} args - Pagination arguments.
 * @param {number} args.page - Current page number.
 * @param {number} args.limit - Number of items per page.
 * @returns {Promise<InventorySummaryResponse>} - Inventory summary with pagination.
 */
export const fetchInventorySummaryThunk = createAsyncThunk<
  InventorySummaryResponse,
  { page: number; limit: number },
  { rejectValue: string }
>(
  'inventorySummary/fetchAll',
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchInventorySummary(page, limit);
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch inventory summary'
      );
    }
  }
);
