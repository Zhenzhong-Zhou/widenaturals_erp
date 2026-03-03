import { createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseInventoryService } from '@services/warehouseInventoryService';
import type { PaginatedResponse } from '@shared-types/api';
import type {
  FetchWarehouseInventoryArgs,
  FetchWarehouseInventoryItemSummaryParams,
  WarehouseInventoryItemSummary,
  WarehouseInventoryRecordsResponse,
  WarehouseInventorySummaryDetailsByItemIdResponse,
} from '@features/warehouseInventory/state/warehouseInventoryTypes';
import type {
  AdjustInventoryRequestBody,
  CreateInventoryRecordsRequest,
  InventoryRecordsResponse,
  InventorySummaryDetailByItemIdParams,
} from '@features/inventoryShared/types/InventorySharedType';
import { extractUiErrorPayload, UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Fetches paginated warehouse inventory **item summaries**
 * (SKU-level products + material-level items).
 *
 * Responsibilities:
 * - Calls `warehouseInventoryService.fetchWarehouseInventoryItemSummary`
 * - Preserves backend pagination metadata
 * - Returns UI-consumable summary rows (no reducer-side normalization needed)
 *
 * Error Model:
 * - Failures reject with `UiErrorPayload` via `extractUiErrorPayload`
 *
 * @param params - Pagination + filtering options (e.g. page, limit, itemType)
 * @returns PaginatedResponse<WarehouseInventoryItemSummary>
 */
export const fetchWarehouseInventoryItemSummaryThunk = createAsyncThunk<
  PaginatedResponse<WarehouseInventoryItemSummary>,
  FetchWarehouseInventoryItemSummaryParams,
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/fetchWarehouseInventorySummary',
  async (params, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventoryItemSummary(
        params
      );
    } catch (error: unknown) {
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);

/**
 * Fetches paginated warehouse inventory **summary details** for a specific item
 * (SKU or packaging material).
 *
 * Responsibilities:
 * - Calls `warehouseInventoryService.fetchWarehouseInventorySummaryDetailsByItemId`
 * - Preserves backend pagination metadata
 *
 * Error Model:
 * - Failures reject with `UiErrorPayload` via `extractUiErrorPayload`
 *
 * @param params - Query params including itemId and pagination (page, limit)
 * @returns WarehouseInventorySummaryDetailsByItemIdResponse
 */
export const fetchWarehouseInventorySummaryByItemIdThunk = createAsyncThunk<
  WarehouseInventorySummaryDetailsByItemIdResponse,
  InventorySummaryDetailByItemIdParams,
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/fetchSummaryByItemId',
  async (params, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventorySummaryDetailsByItemId(
        params
      );
    } catch (error: unknown) {
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);

/**
 * Fetches paginated warehouse inventory **record rows** (batch-level records).
 *
 * Responsibilities:
 * - Calls `warehouseInventoryService.fetchWarehouseInventoryRecords`
 * - Supports pagination, sorting, and filtering
 * - Returns a structured response with records + pagination metadata
 *
 * Design Notes:
 * - Any batch-type-specific filter cleanup belongs in the service layer
 * - Redux stores the response as-is (no reducer-side normalization required)
 *
 * Error Model:
 * - Failures reject with `UiErrorPayload` via `extractUiErrorPayload`
 *
 * @param args - Pagination + filters + optional sort config
 * @returns WarehouseInventoryRecordsResponse
 */
export const fetchWarehouseInventoryRecordsThunk = createAsyncThunk<
  WarehouseInventoryRecordsResponse,
  FetchWarehouseInventoryArgs,
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/fetchRecords',
  async ({ pagination, filters, sortConfig = {} }, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.fetchWarehouseInventoryRecords(
        pagination,
        filters,
        sortConfig
      );
    } catch (error: unknown) {
      console.error('fetchWarehouseInventoryRecordsThunk error:', error);
      
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);

/**
 * Creates warehouse and/or location inventory records.
 *
 * Responsibilities:
 * - Calls `warehouseInventoryService.createWarehouseInventoryRecords`
 * - Inserts new inventory rows for warehouse + location scopes (as supported by backend)
 * - Returns created/enriched inventory records in the API response envelope
 *
 * Error Model:
 * - Failures reject with `UiErrorPayload` via `extractUiErrorPayload`
 *
 * @param payload - Bulk inventory insert request payload
 * @returns InventoryRecordsResponse
 */
export const createWarehouseInventoryRecordsThunk = createAsyncThunk<
  InventoryRecordsResponse,
  CreateInventoryRecordsRequest,
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/createWarehouseInventoryRecords',
  async (payload, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.createWarehouseInventoryRecords(
        payload
      );
    } catch (error: unknown) {
      console.error('createWarehouseInventoryRecordsThunk error:', error);
      
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);

/**
 * Adjusts warehouse and/or location inventory quantities.
 *
 * Responsibilities:
 * - Calls `warehouseInventoryService.adjustWarehouseInventoryQuantities`
 * - Submits an adjustment payload (batch + delta/quantity updates)
 * - Returns updated inventory rows (often enriched with product/material info)
 *
 * Error Model:
 * - Failures reject with `UiErrorPayload` via `extractUiErrorPayload`
 *
 * @param data - Adjustment payload describing inventory changes
 * @returns InventoryRecordsResponse
 */
export const adjustWarehouseInventoryQuantitiesThunk = createAsyncThunk<
  InventoryRecordsResponse,
  AdjustInventoryRequestBody,
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/adjustQuantities',
  async (data, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.adjustWarehouseInventoryQuantities(
        data
      );
    } catch (error: unknown) {
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);
