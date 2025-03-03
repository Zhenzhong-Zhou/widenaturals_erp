import { createSlice } from '@reduxjs/toolkit';
import { fetchAdjustmentReportThunk } from './reportThunks.ts';
import { ReportState } from './reportTypes.ts';

const initialState: ReportState = {
  data: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    totalRecords: 0,
    totalPages: 1,
  }
};

const adjustmentReportSlice = createSlice({
  name: 'adjustmentReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdjustmentReportThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdjustmentReportThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAdjustmentReportThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export default adjustmentReportSlice.reducer;
