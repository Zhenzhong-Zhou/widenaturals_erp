import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  ComplianceResponse,
  FetchAllCompliancesParams,
} from '@features/compliance';
import { complianceService } from '@services/complianceService';

export const fetchAllCompliancesThunk = createAsyncThunk<
  ComplianceResponse,
  FetchAllCompliancesParams, // Accepts pagination and sorting params
  { rejectValue: string }
>(
  'compliances/fetchAll',
  async ({ page, limit, sortBy, sortOrder }, { rejectWithValue }) => {
    try {
      return await complianceService.fetchAllCompliances({
        page,
        limit,
        sortBy,
        sortOrder,
      });
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch compliance data'
      );
    }
  }
);
