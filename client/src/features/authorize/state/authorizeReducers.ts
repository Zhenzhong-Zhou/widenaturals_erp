import permissionsReducer from './permissionSlice';

/**
 * Reducer map for the Authorize feature.
 *
 * Notes:
 * - Imports slice reducers locally (never from index/barrel files)
 * - Exposed as a reducer group consumed by the root reducer only
 * - Prevents circular ESM initialization (TDZ) issues
 * - Slice reducers remain private implementation details
 */
export const authorizeReducers = {
  /** Permission and authorization state */
  permissions: permissionsReducer,
};
