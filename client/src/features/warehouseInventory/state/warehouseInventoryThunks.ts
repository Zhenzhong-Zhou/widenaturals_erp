/**
 * @file warehouseInventoryThunks.ts
 *
 * Redux async thunks for the Warehouse Inventory domain.
 * Each thunk calls the corresponding service function, flattens the
 * API response for UI consumption, and handles error extraction.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  PaginatedWarehouseInventoryListUiResponse,
  WarehouseInventoryQueryParams,
} from '@features/warehouseInventory';
import { extractUiErrorPayload, type UiErrorPayload } from '@utils/error/uiErrorUtils';
import { warehouseInventoryService } from '@services/warehouseInventoryService';
import { flattenWarehouseInventoryRecords } from '@features/warehouseInventory/utils';

/**
 * Fetch a paginated list of warehouse inventory records with optional filters and sorting.
 */
export const fetchPaginatedWarehouseInventoryThunk = createAsyncThunk<
  PaginatedWarehouseInventoryListUiResponse,
  WarehouseInventoryQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/fetchPaginatedWarehouseInventory',
    async (params, { rejectWithValue }) => {
      try {
        const response =
          await warehouseInventoryService.fetchPaginatedWarehouseInventory(params);
        return {
          ...response,
          data: flattenWarehouseInventoryRecords(response.data),
        };
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);
