import loginReducer from './loginSlice';
import refreshSessionReducer from './refreshSessionSlice';

/**
 * Reducer map for the Session feature.
 *
 * This object is consumed exclusively by the root reducer to
 * compose the `session` state subtree.
 *
 * Architectural guarantees:
 * - Slice reducers are imported directly to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are treated as private implementation details.
 * - This module must NOT import feature-level or state
 *   barrel (`index.ts`) files.
 *
 * Rationale:
 * - Prevents hidden dependency graphs
 * - Preserves predictable reducer initialization order
 * - Keeps feature boundaries explicit and enforceable
 */
export const sessionReducers = {
  /** Authenticated session state (tokens, expiry, metadata) */
  login: loginReducer,
  
  /** Background refresh / session recovery state */
  refreshSession: refreshSessionReducer,
};
