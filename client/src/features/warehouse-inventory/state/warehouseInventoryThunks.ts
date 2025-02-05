import { createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseInventoryService } from '../../../services';
import { WarehouseInventoryResponse } from './warehouseInventoryTypes.ts';

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
