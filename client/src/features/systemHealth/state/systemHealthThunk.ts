import { createAsyncThunk } from '@reduxjs/toolkit';
import type { HealthApiResponse } from '@features/systemHealth';
import { systemHealthService } from '@services/systemHealthService';
import { extractUiErrorPayload } from '@utils/error';
import { UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Fetches the public system health status.
 *
 * Responsibilities:
 * - Calls systemHealthService.fetchPublicHealthStatus
 * - Retrieves a system health snapshot used for diagnostics
 *   and application bootstrap checks
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @returns HealthApiResponse containing system health information
 */
export const fetchSystemHealthThunk = createAsyncThunk<
  HealthApiResponse,
  void,
  { rejectValue: UiErrorPayload }
>(
  'systemHealth/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await systemHealthService.fetchPublicHealthStatus();
    } catch (error: unknown) {
      return rejectWithValue(
        extractUiErrorPayload(error)
      );
    }
  }
);
