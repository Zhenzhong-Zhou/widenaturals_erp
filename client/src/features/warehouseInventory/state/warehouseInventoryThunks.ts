/**
 * @file warehouseInventoryThunks.ts
 *
 * Redux async thunks for the Warehouse Inventory domain.
 * Each thunk calls the corresponding service function, flattens the
 * API response for UI consumption, and handles error extraction.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  AdjustWarehouseInventoryQuantityRequest,
  AdjustWarehouseInventoryQuantityResponse,
  CreateWarehouseInventoryRequest,
  CreateWarehouseInventoryResponse, InventoryActivityLogQueryParams, PaginatedInventoryActivityLogListUiResponse,
  PaginatedWarehouseInventoryListUiResponse,
  RecordWarehouseInventoryOutboundRequest, RecordWarehouseInventoryOutboundResponse,
  UpdateWarehouseInventoryMetadataRequest,
  UpdateWarehouseInventoryMetadataResponse,
  UpdateWarehouseInventoryStatusRequest,
  UpdateWarehouseInventoryStatusResponse, WarehouseInventoryDetailResponse,
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

/**
 * Create one or more warehouse inventory records under a specific warehouse.
 */
export const createWarehouseInventoryThunk = createAsyncThunk<
  CreateWarehouseInventoryResponse,
  { warehouseId: string; payload: CreateWarehouseInventoryRequest },
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/create',
    async ({ warehouseId, payload }, { rejectWithValue }) => {
      try {
        return await warehouseInventoryService.createWarehouseInventory(
          warehouseId,
          payload
        );
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);

/**
 * Adjust quantities for one or more warehouse inventory records.
 */
export const adjustWarehouseInventoryQuantitiesThunk = createAsyncThunk<
  AdjustWarehouseInventoryQuantityResponse,
  { warehouseId: string; payload: AdjustWarehouseInventoryQuantityRequest },
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/adjustQuantities',
    async ({ warehouseId, payload }, { rejectWithValue }) => {
      try {
        return await warehouseInventoryService.adjustWarehouseInventoryQuantities(
          warehouseId,
          payload
        );
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);

/**
 * Update statuses for one or more warehouse inventory records.
 */
export const updateWarehouseInventoryStatusesThunk = createAsyncThunk<
  UpdateWarehouseInventoryStatusResponse,
  { warehouseId: string; payload: UpdateWarehouseInventoryStatusRequest },
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/updateStatuses',
    async ({ warehouseId, payload }, { rejectWithValue }) => {
      try {
        return await warehouseInventoryService.updateWarehouseInventoryStatuses(
          warehouseId,
          payload
        );
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);

/**
 * Update metadata for a single warehouse inventory record.
 */
export const updateWarehouseInventoryMetadataThunk = createAsyncThunk<
  UpdateWarehouseInventoryMetadataResponse,
  { warehouseId: string; inventoryId: string; payload: UpdateWarehouseInventoryMetadataRequest },
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/updateMetadata',
    async ({ warehouseId, inventoryId, payload }, { rejectWithValue }) => {
      try {
        return await warehouseInventoryService.updateWarehouseInventoryMetadata(
          warehouseId,
          inventoryId,
          payload
        );
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);

/**
 * Record outbound for one or more warehouse inventory records.
 */
export const recordWarehouseInventoryOutboundThunk = createAsyncThunk<
  RecordWarehouseInventoryOutboundResponse,
  { warehouseId: string; payload: RecordWarehouseInventoryOutboundRequest },
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/recordOutbound',
    async ({ warehouseId, payload }, { rejectWithValue }) => {
      try {
        return await warehouseInventoryService.recordWarehouseInventoryOutbound(
          warehouseId,
          payload
        );
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);

/**
 * Fetch detail for a single warehouse inventory record.
 */
export const fetchWarehouseInventoryDetailThunk = createAsyncThunk<
  WarehouseInventoryDetailResponse,
  { warehouseId: string; inventoryId: string },
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/fetchDetail',
    async ({ warehouseId, inventoryId }, { rejectWithValue }) => {
      try {
        return await warehouseInventoryService.fetchWarehouseInventoryDetail(
          warehouseId,
          inventoryId
        );
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);

/**
 * Fetch a paginated list of inventory activity log records.
 */
export const fetchInventoryActivityLogThunk = createAsyncThunk<
  PaginatedInventoryActivityLogListUiResponse,
  InventoryActivityLogQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'warehouseInventory/fetchActivityLog',
    async (params, { rejectWithValue }) => {
      try {
        return await warehouseInventoryService.fetchInventoryActivityLog(params);
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);
