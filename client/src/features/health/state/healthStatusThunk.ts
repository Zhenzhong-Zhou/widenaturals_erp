import { createAsyncThunk } from '@reduxjs/toolkit';
import type { HealthState } from '@features/health/state/healthStatusState';
import { publicHealthStatusService } from '@services/publicHealthStatusService';

export const fetchHealthStatus = createAsyncThunk<
  HealthState,
  void,
  { rejectValue: string }
>('health/fetchHealthStatus', async (_, { rejectWithValue }) => {
  try {
    return await publicHealthStatusService.fetchPublicHealthStatus();
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});
