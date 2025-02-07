import { createAsyncThunk } from '@reduxjs/toolkit';
import { WarehouseResponse } from './warehouseTypes.ts';
import { warehouseService } from '../../../services';

// Define API Thunk
export const fetchWarehouses = createAsyncThunk<
  WarehouseResponse, // Return type
  { page?: number; limit?: number; sortBy?: string; sortOrder?: string }, // Arguments
  { rejectValue: string } // Error type
>(
  'warehouses/fetchWarehouses',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      return await warehouseService.fetchAllWarehouses(page, limit);
    } catch (error) {
      return rejectWithValue('Failed to fetch warehouses.');
    }
  }
);
