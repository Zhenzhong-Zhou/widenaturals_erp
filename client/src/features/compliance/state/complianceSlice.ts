import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  type Compliance,
  type CompliancePagination,
  type ComplianceResponse,
  fetchAllCompliancesThunk,
} from '@features/compliance';

interface ComplianceState {
  data: Compliance[];
  pagination: CompliancePagination;
  loading: boolean;
  error: string | null;
}

const initialState: ComplianceState = {
  data: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

const complianceSlice = createSlice({
  name: 'compliances',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCompliancesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllCompliancesThunk.fulfilled,
        (state, action: PayloadAction<ComplianceResponse>) => {
          state.loading = false;
          state.data = action.payload.data; // Extracts `data` array
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchAllCompliancesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export default complianceSlice.reducer;
