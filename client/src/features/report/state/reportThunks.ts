import { createAsyncThunk } from '@reduxjs/toolkit';
import { reportService } from '@services/reportService';
import type {
  InventoryActivityLogBaseDataResponse,
  InventoryActivityLogPaginatedResponse,
  InventoryActivityLogQueryParams,
} from './reportTypes';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Thunk to fetch the base (non-paginated) inventory activity logs.
 *
 * This is typically used for general users who only have access to
 * their scope of activity logs. It returns a fixed first page with a specified limit.
 *
 * @param limit - The number of records to fetch (default is 30).
 * @returns A thunk action that resolves with `InventoryActivityLogBaseDataResponse`
 *          or dispatches a rejected action on failure.
 */
export const fetchBaseInventoryActivityLogsThunk = createAsyncThunk<
  InventoryActivityLogBaseDataResponse,
  number | undefined,
  { rejectValue: UiErrorPayload }
>(
  'report/fetchBaseInventoryActivityLogs',
  async (limit = 30, { rejectWithValue }) => {
    try {
      return await reportService.fetchBaseInventoryActivityLogs({ limit });
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Thunk to fetch a paginated list of inventory activity logs based on filters.
 *
 * This is typically used by higher-privileged users (e.g., admins or auditors)
 * who need to query large logs with filter and pagination support.
 *
 * @param params - Filtering and pagination options to apply
 * @returns A thunk action that resolves with `InventoryActivityLogPaginatedResponse`
 *          or dispatches a rejected action on failure.
 */
export const fetchPaginatedInventoryActivityLogsThunk = createAsyncThunk<
  InventoryActivityLogPaginatedResponse,
  InventoryActivityLogQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'report/fetchPaginatedInventoryActivityLogs',
  async (params, { rejectWithValue }) => {
    try {
      return await reportService.fetchPaginatedInventoryActivityLogs(params);
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
