/**
 * @file warehouseThunks.ts
 *
 * Redux async thunks for the Warehouse domain.
 * Each thunk calls the corresponding service function and handles error extraction.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  WarehouseQueryParams,
  PaginatedWarehouseListApiResponse,
  WarehouseDetailApiResponse,
} from '@features/warehouse/state/warehouseTypes';
import { extractUiErrorPayload, type UiErrorPayload } from '@utils/error/uiErrorUtils';
import { warehouseService } from '@services/warehouseService';

/**
 * Fetch a paginated list of warehouses with optional filters and sorting.
 */
export const fetchPaginatedWarehousesThunk = createAsyncThunk<
  PaginatedWarehouseListApiResponse,
  WarehouseQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'warehouse/fetchPaginatedWarehouses',
  async (params, { rejectWithValue }) => {
    try {
      return await warehouseService.fetchPaginatedWarehouses(params);
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Fetch full warehouse detail by id.
 */
export const fetchWarehouseByIdThunk = createAsyncThunk<
  WarehouseDetailApiResponse,
  string,
  { rejectValue: UiErrorPayload }
>(
  'warehouse/fetchWarehouseById',
  async (warehouseId, { rejectWithValue }) => {
    try {
      return await warehouseService.fetchWarehouseById(warehouseId);
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
