import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Session state slice.
 *
 * Represents the minimal client-side session metadata required
 * for authenticated operation.
 *
 * Notes:
 * - This slice intentionally stores only the access token.
 * - Persistent authentication state is primarily cookie-based.
 * - Additional session metadata (expiry, status) should live
 *   in dedicated slices if needed.
 */
interface SessionState {
  /** In-memory access token used for authenticated requests */
  accessToken: string | null;
}

const initialState: SessionState = {
  accessToken: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  
  reducers: {
    /**
     * Sets or updates the access token.
     *
     * Used during:
     * - Initial login
     * - Token refresh flows
     *
     * This reducer does not perform validation and assumes
     * the token has already been verified upstream.
     */
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    
    /**
     * Resets session state to its initial, unauthenticated form.
     *
     * Intended for:
     * - Explicit user logout
     * - Session invalidation initiated by the user
     */
    resetSession: () => initialState,
    
    /**
     * Invalidates the current session state.
     *
     * Semantically equivalent to `resetSession`, but provided
     * as a distinct action to allow clearer intent when handling
     * authentication or authorization failures.
     */
    invalidateSession: () => initialState,
  },
});

export const {
  setAccessToken,
  resetSession,
  invalidateSession,
} = sessionSlice.actions;
export default sessionSlice.reducer;
