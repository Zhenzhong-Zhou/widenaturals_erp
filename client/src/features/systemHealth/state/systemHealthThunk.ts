import { createAsyncThunk } from '@reduxjs/toolkit';
import type { HealthApiResponse } from '@features/systemHealth';
import { systemHealthService } from '@services/systemHealthService';
import { extractErrorMessage } from '@utils/error';

/**
 * Thunk: Fetch public system health status.
 *
 * Calls `systemHealthService.fetchPublicHealthStatus`,
 * which hits `GET /public/health` and returns a typed
 * {@link HealthApiResponse}.
 *
 * ## Behavior
 * - Public, unauthenticated request
 * - Used during app bootstrap and diagnostics
 * - Resolves with system health snapshot
 * - Rejects with a user-friendly error message
 *
 * @returns A typed thunk action resolving to `HealthApiResponse`
 *          or rejecting with `rejectValue: string`.
 */
export const fetchSystemHealthThunk = createAsyncThunk<
  HealthApiResponse,     // fulfilled type
  void,                  // argument type
  { rejectValue: string }
>('systemHealth/fetch', async (_, { rejectWithValue }) => {
  try {
    return await systemHealthService.fetchPublicHealthStatus();
  } catch (error: unknown) {
    return rejectWithValue(extractErrorMessage(error));
  }
});
