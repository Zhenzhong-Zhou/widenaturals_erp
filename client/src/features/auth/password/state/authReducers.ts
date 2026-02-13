import changePasswordReducer from './changePasswordSlice';

/**
 * Reducer map for authenticated security operations.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `auth` state subtree.
 *
 * Scope:
 * - Authenticated password change workflow
 *
 * Design Principles:
 * - Slice reducers are imported locally to prevent circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are considered private implementation details
 *   of the feature and must not be re-exported through barrels.
 * - Reducer aggregators must NEVER import feature-level
 *   or state index files.
 */
export const authReducers = {
  /** Authenticated password change state */
  changePassword: changePasswordReducer,
};
