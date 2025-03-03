import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store.ts';
import { ReportState } from './reportTypes.ts';

// Select the adjustment report state
const selectAdjustmentReportState = (state: RootState) => state.adjustmentReport;

// Create a memoized selector
export const selectAdjustmentReport = createSelector(
  selectAdjustmentReportState, // ✅ Extract only required state
  (report: ReportState) => ({
    data: report.data ?? [], // ✅ Ensures `data` is always an array
    loading: report.loading,
    error: report.error,
    pagination: {
      page: report.pagination?.page ?? 1,
      limit: report.pagination?.limit ?? 10,
      totalRecords: report.pagination?.totalRecords ?? 0,
      totalPages: report.pagination?.totalPages ?? 1,
    },
  })
);