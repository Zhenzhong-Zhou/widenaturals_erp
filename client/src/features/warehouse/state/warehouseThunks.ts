import { createAsyncThunk } from '@reduxjs/toolkit';
import type { WarehouseDetailsResponse, WarehouseResponse } from '@features/warehouse';
import { warehouseService } from '@services/warehouseService';

// Define API Thunk
export const fetchWarehousesThunk = createAsyncThunk<
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

export const fetchWarehouseDetailsThunk = createAsyncThunk<
  WarehouseDetailsResponse,
  { warehouseId: string }
>('warehouse/fetchDetails', async ({ warehouseId }, { rejectWithValue }) => {
  try {
    const data = await warehouseService.fetchWarehouseDetails(warehouseId);
    if (!data) throw new Error('No data received');
    return data;
  } catch (error) {
    console.error('Error fetching warehouse details:', error);
    return rejectWithValue('Failed to fetch warehouse details.');
  }
});
