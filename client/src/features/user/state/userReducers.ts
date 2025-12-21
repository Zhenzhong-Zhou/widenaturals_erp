import paginatedUsersReducer from './paginatedUsersSlice';
import userProfileReducer from './userProfileSlice';

/**
 * Reducer map for the User feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `user` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const userReducers = {
  /** Paginated user list with filters and pagination metadata */
  paginatedUsers: paginatedUsersReducer,
  
  /** User profile detail and update state */
  userProfile: userProfileReducer,
};
