import loginReducer from './loginSlice';
import sessionReducer from './sessionSlice';

/**
 * Session feature reducer map.
 *
 * Defines the reducer composition for the `session` state subtree.
 * This object is consumed exclusively by the root reducer and must
 * remain a thin, declarative mapping of slice reducers.
 *
 * Architectural guarantees:
 * - Slice reducers are imported directly to avoid ES module
 *   initialization order (TDZ) issues.
 * - Slice reducers are treated as private implementation details
 *   of the Session feature.
 * - This module MUST NOT import feature-level or state barrel
 *   (`index.ts`) files.
 *
 * Invariants:
 * - No side effects
 * - No cross-feature imports
 * - Stable reducer keys
 *
 * Rationale:
 * - Prevents hidden dependency graphs
 * - Preserves predictable reducer initialization order
 * - Keeps feature boundaries explicit and enforceable
 */
export const sessionReducers = {
  /** Authentication and login-related session state */
  login: loginReducer,

  /** Persistent session metadata (lifecycle, expiry, status) */
  session: sessionReducer,
};
