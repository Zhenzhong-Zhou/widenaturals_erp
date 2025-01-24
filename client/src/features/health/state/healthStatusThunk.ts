import { createAsyncThunk } from '@reduxjs/toolkit';
import { publicHealthStatusService } from '../../../services';
import { HealthState } from './healthStatusState.ts';

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
