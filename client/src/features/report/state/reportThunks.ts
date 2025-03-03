import { createAsyncThunk } from '@reduxjs/toolkit';
import { AdjustmentReportParams } from './reportTypes.ts';
import { reportService } from '../../../services';

/**
 * Async thunk to fetch warehouse inventory adjustments report.
 */
export const fetchAdjustmentReportThunk = createAsyncThunk(
  'adjustmentReport/fetch',
  async (params: Partial<AdjustmentReportParams>, { rejectWithValue }) => {
    try {
      return await reportService.fetchAdjustmentReport({
        reportType: params.reportType ?? 'daily',
        userTimezone: params.userTimezone ?? 'UTC',
        startDate: params.startDate,
        endDate: params.endDate,
        warehouseId: params.warehouseId,
        inventoryId: params.inventoryId,
        page: params.page ?? 1,
        limit: params.limit ?? 50,
        exportFormat: params.exportFormat
      });
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch adjustment report');
    }
  }
);
