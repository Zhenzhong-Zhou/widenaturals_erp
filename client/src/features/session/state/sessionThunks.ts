import { createAsyncThunk } from '@reduxjs/toolkit';
import { persistor } from '@store/store';
import { sessionService } from '@services/sessionService';
import {
  extractErrorMessage,
  extractUiErrorPayload
} from '@utils/error';
import { LoginRequestBody, LoginResponseData } from '@features/session';
import { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { resetLogin } from '@features/session/state/loginSlice';
import {
  markBootstrapComplete,
  resetSession,
  setAccessToken
} from '@features/session/state/sessionSlice';

/* =========================================================
 * Login
 * ======================================================= */

/**
 * Authenticates a user and establishes the client-side session state.
 *
 * Responsibilities:
 * - Invoke the credential-based login service
 * - Persist the access token into client session state
 * - Surface authentication failures in a UI-safe form
 *
 * Explicitly out of scope:
 * - Token storage mechanism (cookies, HttpOnly, refresh lifecycle)
 * - CSRF token acquisition and rotation
 * - Post-login navigation or UI side effects
 *
 * Notes:
 * - Network and authentication errors are normalized via rejectWithValue
 * - This thunk performs minimal orchestration and delegates
 *   side effects to reducers and service utilities
 */
export const loginThunk = createAsyncThunk<
  LoginResponseData,
  LoginRequestBody,
  { rejectValue: string }
>(
  'session/login',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const response = await sessionService.login(email, password);
      
      dispatch(setAccessToken(response.accessToken));
      return response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/* =========================================================
 * Session Bootstrap
 * ======================================================= */

/**
 * Bootstraps the client-side session state on application startup.
 *
 * Responsibilities:
 * - Attempt to restore an existing session using the refresh-token flow
 * - Hydrate in-memory access token state when refresh succeeds
 * - Normalize unauthenticated outcomes by resetting session state
 * - Always finalize the bootstrap lifecycle
 *
 * Explicitly out of scope:
 * - Credential-based login flows
 * - UI navigation, redirects, or routing decisions
 * - Permission loading or authorization evaluation
 *
 * Behavioral guarantees:
 * - Missing, expired, or invalid refresh tokens are treated as unauthenticated states
 * - Refresh failures do not surface errors to the UI
 * - The bootstrap lifecycle is always completed via `markBootstrapComplete`
 *
 * Notes:
 * - Access tokens are stored in memory only
 * - A successful refresh is defined strictly by the presence of an access token
 */
export const bootstrapSessionThunk = createAsyncThunk(
  'session/bootstrap',
  async (_, { dispatch }) => {
    try {
      const result = await sessionService.refreshToken();
      
      if (result?.accessToken) {
        dispatch(setAccessToken(result.accessToken));
      } else {
        dispatch(resetSession());
      }
    } catch {
      // System-level failure only (network, 5xx, etc.)
      dispatch(resetSession());
    } finally {
      // Always mark bootstrap as complete
      dispatch(markBootstrapComplete());
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
