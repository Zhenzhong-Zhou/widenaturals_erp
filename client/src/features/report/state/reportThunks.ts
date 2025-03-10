import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  AdjustmentReportParams,
  InventoryActivityLogParams,
  InventoryActivityLogsResponse, InventoryHistoryParams,
  InventoryHistoryResponse,
} from './reportTypes.ts';
import { reportService } from '../../../services';

/**
 * Thunk for fetching paginated adjustment reports.
 */
export const fetchAdjustmentReportThunk = createAsyncThunk(
  'adjustmentReport/fetch',
  async (params: Partial<AdjustmentReportParams>, { rejectWithValue }) => {
    try {
      return await reportService.fetchAdjustmentReport(params);
    } catch (error) {
      return rejectWithValue('Failed to fetch adjustment report');
    }
  }
);

/**
 * Thunk for exporting adjustment reports (CSV, PDF, TXT).
 */
export const exportAdjustmentReportThunk = createAsyncThunk(
  'adjustmentReport/export',
  async (params: Partial<AdjustmentReportParams>, { rejectWithValue }) => {
    try {
      return await reportService.exportAdjustmentReport(params);
    } catch (error) {
      return rejectWithValue('Failed to export adjustment report');
    }
  }
);

/**
 * Thunk to fetch inventory activity logs with optional filters.
 */
export const fetchInventoryActivityLogsThunk = createAsyncThunk<
  InventoryActivityLogsResponse, // Expected return type
  Partial<InventoryActivityLogParams>, // Parameters type
  { rejectValue: string } // Error handling type
>(
  'inventory/fetchLogs',
  async (params, { rejectWithValue }) => {
    try {
      return await reportService.fetchInventoryActivityLogs(params);
    } catch (error) {
      console.error('Thunk Error: Fetching inventory logs failed', error);
      return rejectWithValue('Failed to fetch inventory activity logs');
    }
  }
);

/**
 * Thunk to export inventory activity logs as a file (CSV, PDF, TXT).
 */
export const exportInventoryActivityLogsThunk = createAsyncThunk<
  Blob, // Expected return type
  Partial<InventoryActivityLogParams>, // Parameters type
  { rejectValue: string } // Error handling type
>(
  'inventory/exportLogs',
  async (params, { rejectWithValue }) => {
    try {
      return await reportService.exportInventoryActivityLogs(params);
    } catch (error) {
      console.error('Thunk Error: Exporting inventory logs failed', error);
      return rejectWithValue('Failed to export inventory activity logs');
    }
  }
);

/**
 * Thunk to fetch inventory history with optional filters.
 */
export const fetchInventoryHistoryThunk = createAsyncThunk<
  InventoryHistoryResponse, // Expected return type
  Partial<InventoryHistoryParams>, // Parameters type
  { rejectValue: string } // Error handling type
>(
  'inventory/fetchHistory',
  async (params, { rejectWithValue }) => {
    try {
      return await reportService.fetchInventoryHistory(params);
    } catch (error) {
      console.error('Thunk Error: Fetching inventory history failed:', error);
      return rejectWithValue('An unexpected error occurred.');
    }
  }
);

/**
 * Thunk to export inventory history as a file (CSV, PDF, TXT).
 */
export const exportInventoryHistoryThunk = createAsyncThunk<
  Blob, // Expected return type
  Partial<InventoryHistoryParams>, // Parameters type
  { rejectValue: string } // Error handling type
>(
  'inventory/exportHistory',
  async (params, { rejectWithValue }) => {
    try {
      return await reportService.exportInventoryHistory(params);
    } catch (error) {
      console.error('Thunk Error: Exporting inventory history failed:', error);
      return rejectWithValue('An unexpected error occurred.');
    }
  }
);
