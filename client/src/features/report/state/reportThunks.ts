import { createAsyncThunk } from '@reduxjs/toolkit';
import { AdjustmentReportParams } from './reportTypes.ts';
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
