import { createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryService } from '../../../services';
import { InventoryResponse } from './inventoryTypes.ts';

/**
 * Fetch all inventories with pagination, sorting, and error handling.
 */
export const fetchAllInventories = createAsyncThunk<
  InventoryResponse,
  { page: number; limit: number; sortBy?: string; sortOrder?: string },
  { rejectValue: string }
>(
  'inventory/fetchAllInventories',
  async ({ page, limit, sortBy = 'created_at', sortOrder = 'DESC' }, { rejectWithValue }) => {
    try {
      return await inventoryService.fetchAllInventories(page, limit, sortBy, sortOrder);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventories');
    }
  }
);
