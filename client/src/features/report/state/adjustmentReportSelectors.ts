import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store.ts';
import { AdjustmentReportState } from './reportTypes.ts';

// Select the adjustment report state
const selectAdjustmentReportState = (state: RootState) =>
  state.adjustmentReport;

// Memoized Selector for Report Data (Includes Exports)
export const selectAdjustmentReport = createSelector(
  selectAdjustmentReportState,
  (report: AdjustmentReportState) => ({
    data: report.data ?? [], // Ensures `data` is always an array
    loading: report.loading,
    error: report.error,
    pagination: {
      page: report.pagination?.page ?? 1,
      limit: report.pagination?.limit ?? 50,
      totalRecords: report.pagination?.totalRecords ?? 0,
      totalPages: report.pagination?.totalPages ?? 1,
    },
    exportData: report.exportData, // Includes exported file Blob
    exportFormat: report.exportFormat, // Track selected export format
    exportLoading: report.exportLoading, // Separate loading state for exports
    exportError: report.exportError, // Separate error state for exports
  })
);
