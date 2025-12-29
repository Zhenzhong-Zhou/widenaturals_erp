import paginatedUsersReducer from './paginatedUsersSlice';
import userSelfProfileReducer from './userSelfProfileSlice';
import userViewedProfileReducer from './userViewedProfileSlice';

/**
 * Reducer map for the User feature.
 *
 * This reducer group is composed into the root reducer
 * to form the `user` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported directly to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details of
 *   the User feature and must not be imported elsewhere.
 * - Reducer aggregators must NEVER import feature or state
 *   barrel (`index.ts`) files.
 *
 * State composition:
 * - `paginatedUsers`     → Admin/list views with pagination & filters
 * - `userSelfProfile`    → Authenticated user's own profile
 * - `userViewedProfile`  → Privileged (HR/Admin) viewed user profile
 */
export const userReducers = {
  /** Paginated user list with filters and pagination metadata */
  paginatedUsers: paginatedUsersReducer,
  
  /** Authenticated user's own profile state */
  userSelfProfile: userSelfProfileReducer,
  
  /** HR/Admin viewed user profile state */
  userViewedProfile: userViewedProfileReducer,
};
