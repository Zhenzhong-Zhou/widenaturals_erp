import resetPasswordReducer from './resetPasswordSlice';

/**
 * Reducer map for the Reset Password feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `resetPassword` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const resetPasswordReducers = {
  /** Password reset workflow state */
  resetPassword: resetPasswordReducer,
};
