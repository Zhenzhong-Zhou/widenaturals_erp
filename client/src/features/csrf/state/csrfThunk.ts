import { createAsyncThunk } from '@reduxjs/toolkit';
import { csrfService } from '@services/csrfService';
import { extractErrorMessage } from '@utils/error';

/**
 * Fetches a CSRF token from the backend for client-side request protection.
 *
 * Responsibilities:
 * - Requests a fresh CSRF token from the server
 * - Validates token presence
 * - Normalizes errors into a UI-safe message
 *
 * Error handling:
 * - Rejects with a user-facing string message only
 * - Intentionally omits diagnostic metadata
 *
 * Intended usage:
 * - App bootstrap
 * - Auth/session initialization
 * - Non-observable UI flows
 */
export const getCsrfTokenThunk = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>('csrf/fetchCsrfToken', async (_, { rejectWithValue }) => {
  try {
    const csrfToken = await csrfService.fetchCsrfToken();

    // Defensive guard: backend must always return a non-empty CSRF token
    if (!csrfToken) {
      throw new Error('CSRF token is missing or invalid.');
    }

    return csrfToken;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});
