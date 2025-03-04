import { createSlice } from '@reduxjs/toolkit';
import {
  fetchAdjustmentReportThunk,
  exportAdjustmentReportThunk,
} from './reportThunks.ts';
import { ReportState } from './reportTypes.ts';

const initialState: ReportState = {
  data: [], // Holds paginated data for UI
  exportData: null, // Stores exported file data
  exportFormat: null, // Tracks export type (CSV, PDF, etc.)
  loading: false, // Loading state for paginated fetch
  exportLoading: false, // Separate loading state for exports
  error: null,
  exportError: null,
  pagination: {
    page: 1,
    limit: 50,
    totalRecords: 0,
    totalPages: 1,
  },
};

const adjustmentReportSlice = createSlice({
  name: 'adjustmentReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Standard Fetching (Paginated)
    builder
      .addCase(fetchAdjustmentReportThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdjustmentReportThunk.fulfilled, (state, action) => {
        state.loading = false;

        // Ensure response is of correct type (Paginated Data)
        if ('data' in action.payload && 'pagination' in action.payload) {
          state.data = action.payload.data || [];
          state.pagination = action.payload.pagination || {
            page: 1,
            limit: 50,
            totalRecords: 0,
            totalPages: 1,
          };
        } else {
          console.warn('Unexpected payload type:', action.payload);
        }
      })
      .addCase(fetchAdjustmentReportThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Export Report Handling (CSV, PDF, TXT)
    builder
      .addCase(exportAdjustmentReportThunk.pending, (state, action) => {
        state.exportLoading = true;
        state.exportError = null;
        state.exportFormat = action.meta.arg.exportFormat || 'csv';
      })
      .addCase(exportAdjustmentReportThunk.fulfilled, (state, action) => {
        state.exportLoading = false;

        // Ensure response is a Blob before storing it
        if (action.payload instanceof Blob) {
          state.exportData = action.payload; // Store the exported file as a Blob
        } else {
          console.warn('Unexpected payload type for export:', action.payload);
        }
      })
      .addCase(exportAdjustmentReportThunk.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload as string;
      });
  },
});

export default adjustmentReportSlice.reducer;
