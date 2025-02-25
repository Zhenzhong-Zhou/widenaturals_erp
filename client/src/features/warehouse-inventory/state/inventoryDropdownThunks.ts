import { createAsyncThunk } from '@reduxjs/toolkit';
import { dropdownService } from '../../../services';

/**
 * Fetches the list of warehouses for the dropdown.
 * This should run only once when the component mounts.
 */
export const fetchWarehousesThunk = createAsyncThunk(
  'dropdown/fetchWarehouses',
  async (_, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchWarehousesForDropdown();
    } catch (error: any) {
      console.error('Error fetching warehouses:', error);
      return rejectWithValue(error.message || 'Failed to fetch warehouses');
    }
  }
);

/**
 * Fetches the list of products based on the selected warehouse.
 * This should run only when the user selects a warehouse.
 */
export const fetchProductsByWarehouseThunk = createAsyncThunk(
  'dropdown/fetchProductsByWarehouse',
  async ({ warehouseId }: { warehouseId: string }, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchProductsForDropdown(warehouseId);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);
