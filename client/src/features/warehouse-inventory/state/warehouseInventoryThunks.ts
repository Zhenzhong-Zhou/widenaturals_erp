import { createAsyncThunk } from '@reduxjs/toolkit';
import { dropdownService, warehouseInventoryService } from '../../../services';
import {
  BulkInsertInventoryRequest,
  BulkInsertInventoryResponse,
  InsertInventoryRequestBody,
  WarehouseInventoryDetailsResponse,
  WarehouseInventoryInsertResponse,
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
      return await warehouseInventoryService.fetchAllWarehouseInventories(
        page,
        limit
      );
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch warehouse inventories'
      );
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
      return await warehouseInventoryService.fetchWarehouseInventorySummary(
        summaryPage,
        summaryLimit,
        summaryStatus
      );
    } catch (error) {
      console.error('Failed to fetch warehouse inventory summary:', error);
      return rejectWithValue(
        'Failed to fetch warehouse inventory summary. Please try again.'
      );
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
  {
    warehouseId: string;
    productSummaryPage: number;
    productSummaryLimit: number;
  }
>(
  'warehouseProduct/fetchWarehouseProductSummary',
  async (
    { warehouseId, productSummaryPage, productSummaryLimit },
    { rejectWithValue }
  ) => {
    try {
      return await warehouseInventoryService.fetchWarehouseProductSummary(
        warehouseId,
        productSummaryPage,
        productSummaryLimit
      );
    } catch (error) {
      console.error('Failed to fetch warehouse products summary:', error);
      return rejectWithValue(
        'Failed to fetch warehouse products summary. Please try again.'
      );
    }
  }
);

export const fetchWarehouseInventoryDetailsThunk = createAsyncThunk<
  WarehouseInventoryDetailsResponse,
  {
    warehouseId: string;
    warehouseInventoryDetailPage: number;
    warehouseInventoryDetailLimit: number;
  }
>(
  'warehouseInventory/fetchDetails',
  async (
    {
      warehouseId,
      warehouseInventoryDetailPage,
      warehouseInventoryDetailLimit,
    },
    { rejectWithValue }
  ) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventoryDetails(
        warehouseId,
        warehouseInventoryDetailPage,
        warehouseInventoryDetailLimit
      );
    } catch (error) {
      console.error('Failed to fetch warehouse inventory details:', error);
      return rejectWithValue(
        'Failed to fetch warehouse inventory details. Please try again.'
      );
    }
  }
);

/**
 * Fetches the list of warehouses for the dropdown.
 * This should run only once when the component mounts.
 */
export const fetchWarehousesDropdownThunk = createAsyncThunk(
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
export const fetchProductsDropDownByWarehouseThunk = createAsyncThunk(
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

export const bulkInsertWarehouseInventoryThunk = createAsyncThunk<
  BulkInsertInventoryResponse,
  BulkInsertInventoryRequest
>(
  'warehouseInventory/bulkInsert',
  async (requestData, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.bulkInsertInventory(requestData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to insert warehouse inventory.');
    }
  }
);

// Thunk for fetching inserted inventory records
export const fetchInsertedInventoryRecordsThunk = createAsyncThunk<
  WarehouseInventoryInsertResponse, // ✅ Correct Expected Response Type
  InsertInventoryRequestBody, // ✅ Request Body Type
  { rejectValue: string } // ✅ Error Type
>(
  "insertedInventory/fetchInsertedInventoryRecords",
  async (requestData, { rejectWithValue }) => {
    try {
      // Ensure the response is of type `WarehouseInventoryInsertResponse`
      const response = await warehouseInventoryService.getInsertedInventoryRecords(requestData) as unknown;
      
      // Explicitly cast `response` as `WarehouseInventoryInsertResponse` after validating structure
      if (
        typeof response === "object" &&
        response !== null &&
        "success" in response &&
        "data" in response &&
        Array.isArray((response as WarehouseInventoryInsertResponse).data)
      ) {
        return response as WarehouseInventoryInsertResponse;
      } else {
        return rejectWithValue("Invalid response structure from server.");
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch inserted inventory records.");
    }
  }
);
