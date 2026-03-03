import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  FetchLocationInventoryArgs,
  LocationInventoryKpiSummaryResponse,
  LocationInventoryQueryParams,
  LocationInventoryRecordsResponse,
  LocationInventorySummaryDetailResponse,
  LocationInventorySummaryResponse,
} from './locationInventoryTypes';
import { locationInventoryService } from '@services/locationInventoryService';
import type {
  InventorySummaryDetailByItemIdParams,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';
import { extractUiErrorPayload, UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Redux async thunk to fetch location inventory KPI summary data.
 *
 * Responsibilities:
 * - Delegates data fetching to `locationInventoryService.fetchLocationInventoryKpiSummary`
 * - Supports optional item type filtering (`product` or `packaging_material`)
 * - Returns structured KPI summary metrics for dashboard display
 *
 * Error Handling:
 * - Rejects with a structured {@link UiErrorPayload}
 * - Errors are normalized via `extractUiErrorPayload`
 * - Ensures consistent reducer-level error handling
 *
 * @param itemType - Optional item type filter
 * @returns Fulfilled action containing {@link LocationInventoryKpiSummaryResponse}
 */
export const fetchLocationInventoryKpiSummaryThunk = createAsyncThunk<
  LocationInventoryKpiSummaryResponse,
  ItemType,
  { rejectValue: UiErrorPayload }
>(
  'locationInventory/fetchKpiSummary',
  async (itemType, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventoryKpiSummary(
        itemType
      );
    } catch (error: unknown) {
      console.error(
        'Failed to fetch KPI summary:',
        { itemType, error }
      );
      
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);

/**
 * Redux async thunk to fetch paginated location inventory summary data.
 *
 * Responsibilities:
 * - Delegates to `locationInventoryService.fetchLocationInventorySummary`
 * - Supports pagination, sorting, and filtering
 * - Returns structured summary data with pagination metadata
 *
 * Design Principles:
 * - Contains no domain or business logic
 * - Acts strictly as an API boundary adapter
 *
 * Error Handling:
 * - Rejects with structured {@link UiErrorPayload}
 * - Errors normalized using `extractUiErrorPayload`
 *
 * @param params - Pagination, sorting, and filter parameters
 * @returns Fulfilled action containing {@link LocationInventorySummaryResponse}
 */
export const fetchLocationInventorySummaryThunk = createAsyncThunk<
  LocationInventorySummaryResponse,
  LocationInventoryQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'locationInventory/fetchInventorySummary',
  async (params, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventorySummary(
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
 * Redux async thunk to fetch location inventory summary details by item ID.
 *
 * Responsibilities:
 * - Delegates to `locationInventoryService.fetchLocationInventorySummaryByItemId`
 * - Supports optional pagination parameters
 * - Returns structured detail response with pagination metadata
 *
 * Error Handling:
 * - Rejects with structured {@link UiErrorPayload}
 * - Errors normalized via `extractUiErrorPayload`
 *
 * @param params - Includes `itemId` and optional pagination fields
 * @returns Fulfilled action containing {@link LocationInventorySummaryDetailResponse}
 */
export const fetchLocationInventorySummaryByItemIdThunk = createAsyncThunk<
  LocationInventorySummaryDetailResponse,
  InventorySummaryDetailByItemIdParams,
  { rejectValue: UiErrorPayload }
>(
  'locationInventory/fetchSummaryDetailByItemId',
  async (params, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventorySummaryByItemId(
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
 * Redux async thunk to fetch paginated location inventory records.
 *
 * Responsibilities:
 * - Delegates to `locationInventoryService.fetchLocationInventoryRecords`
 * - Applies batch-type-specific filter normalization via the service layer
 * - Returns structured record data with pagination metadata
 *
 * Design Principles:
 * - No business logic in the thunk
 * - Acts as a thin API boundary adapter
 *
 * Error Handling:
 * - Rejects with structured {@link UiErrorPayload}
 * - Errors normalized via `extractUiErrorPayload`
 *
 * Usage:
 * dispatch(fetchLocationInventoryRecordsThunk({
 *   pagination: { page: 1, limit: 20 },
 *   filters,
 *   sortConfig
 * }));
 *
 * @returns Fulfilled action containing {@link LocationInventoryRecordsResponse}
 */
export const fetchLocationInventoryRecordsThunk = createAsyncThunk<
  LocationInventoryRecordsResponse,
  FetchLocationInventoryArgs,
  { rejectValue: UiErrorPayload }
>(
  'locationInventory/fetchRecords',
  async ({ pagination, filters, sortConfig = {} }, { rejectWithValue }) => {
    try {
      return await locationInventoryService.fetchLocationInventoryRecords(
        pagination,
        filters,
        sortConfig
      );
    } catch (error: unknown) {
      console.error('fetchLocationInventoryRecordsThunk error:', error);
      
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);
