import { createAsyncThunk } from '@reduxjs/toolkit';
import { persistor } from '@store/store';
import { sessionService } from '@services/sessionService';
import { AppError, extractUiErrorPayload } from '@utils/error';
import { LoginRequestBody, LoginResponseData } from '@features/session';
import { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { resetLogin } from '@features/session/state/loginSlice';

/* =========================================================
 * Login
 * ======================================================= */

/**
 * Authenticates the user and initializes client-side auth state.
 *
 * Responsibilities:
 * - Invoke credential-based login service
 * - Surface authentication failures to the UI
 *
 * Notes:
 * - Token persistence and CSRF setup are handled by the service
 * - Redux state updates occur in reducers, not here
 */
export const loginThunk = createAsyncThunk<
  LoginResponseData,
  LoginRequestBody,
  { rejectValue: string }
>(
  'session/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await sessionService.login(email, password);
    } catch (error) {
      return rejectWithValue(
        error instanceof AppError ? error.message : 'Login failed'
      );
    }
  }
);

/* =========================================================
 * Logout
 * ======================================================= */

/**
 * Logs the user out of the application.
 *
 * Behavior:
 * - Attempts a best-effort server-side logout (idempotent).
 * - ALWAYS clears client-side session state, regardless of server outcome.
 * - Purges persisted Redux state to prevent stale rehydration.
 *
 * Design principles:
 * - Logout is a destructive operation with no success payload.
 * - Client-side logout must never be blocked by network failures.
 * - Auth/session cleanup is centralized in this thunk.
 *
 * Error handling:
 * - Server/network errors are normalized into a UiErrorPayload.
 * - Errors are exposed to the UI via rejection, but do not prevent cleanup.
 */
export const logoutThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: UiErrorPayload }
>('session/logout', async (_, { dispatch, rejectWithValue }) => {
  let logoutError: UiErrorPayload | null = null;
  
  try {
    // Best-effort server-side logout (cookie revocation, audit logging, etc.)
    await sessionService.logout();
  } catch (error: unknown) {
    logoutError = extractUiErrorPayload(error);
  } finally {
    /**
     * Client-side logout MUST always occur.
     *
     * - Clears access/CSRF tokens via Redux state reset
     * - Ensures Axios no longer attaches auth headers
     * - Removes any persisted auth/session data
     */
    dispatch(resetLogin());
    await persistor.purge();
  }
  
  // Propagate error to UI if logout request failed
  if (logoutError) {
    return rejectWithValue(logoutError);
  }
  
  return;
});
