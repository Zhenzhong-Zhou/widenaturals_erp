import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Session state slice.
 *
 * Represents the minimal client-side session state required
 * to determine authenticated capability and bootstrap lifecycle.
 *
 * Notes:
 * - This slice intentionally stores only the in-memory access token
 * - Persistent authentication is cookie-based and server-managed
 * - Session lifecycle flags are explicitly modeled to support
 *   bootstrap-safe routing and guard logic
 */
interface SessionState {
  /** In-memory access token used for authenticated requests */
  accessToken: string | null;

  /** Indicates whether session evaluation or mutation is in progress */
  resolving: boolean;

  /** Indicates whether initial session bootstrap has completed */
  bootstrapped: boolean;
}

const initialState: SessionState = {
  accessToken: null,
  resolving: true,
  bootstrapped: false,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,

  reducers: {
    /**
     * Sets or updates the in-memory access token.
     *
     * Used during:
     * - Successful login
     * - Successful token refresh
     *
     * Notes:
     * - This reducer performs no validation
     * - Token integrity is assumed to be verified upstream
     */
    setAccessToken: (state, action: PayloadAction<string>) => {
      if (!action.payload) return;

      state.accessToken = action.payload;
      state.resolving = false;
    },

    /**
     * Resets the session to a known unauthenticated state.
     *
     * Intended for:
     * - Explicit user logout
     * - User-initiated session termination
     *
     * Semantics:
     * - Session is considered resolved
     * - Bootstrap is marked complete
     */
    resetSession: () => ({
      accessToken: null,
      resolving: false,
      bootstrapped: true,
    }),

    /**
     * Invalidates the current session due to authentication failure.
     *
     * Semantically similar to `resetSession`, but intended to
     * communicate session invalidation caused by system or
     * authorization failures rather than user intent.
     *
     * Semantics:
     * - Session is marked as resolved
     * - Bootstrap is preserved
     * - Callers may choose to re-attempt recovery flows
     */
    invalidateSession: () => ({
      accessToken: null,
      resolving: true,
      bootstrapped: true,
    }),

    /**
     * Marks the session bootstrap lifecycle as complete.
     *
     * This action must be dispatched exactly once after
     * initial session evaluation, regardless of outcome.
     */
    markBootstrapComplete: (state) => {
      state.resolving = false;
      state.bootstrapped = true;
    },
  },
});

export const {
  setAccessToken,
  resetSession,
  invalidateSession,
  markBootstrapComplete,
} = sessionSlice.actions;
export default sessionSlice.reducer;
