import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  InventoryResponse,
} from '@features/inventory';
import { inventoryService } from '@services/inventoryService';

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
