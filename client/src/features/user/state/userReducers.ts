import createUserReducer from './createUserSlice';
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
 * - `createUser`         → Create-user mutation state (POST /users)
 * - `paginatedUsers`     → Admin/list views with pagination & filters
 * - `userSelfProfile`    → Authenticated user's own profile
 * - `userViewedProfile`  → Privileged (HR/Admin) viewed user profile
 */
export const userReducers = {
  /**
   * Create-user mutation state.
   *
   * Represents the lifecycle of the POST /users operation.
   *
   * Semantics:
   * - WRITE-only mutation state
   * - Not cached or queryable user data
   * - Safe to reset after success or form unmount
   *
   * MUST NOT:
   * - Be used as a source of truth for user profiles
   * - Be merged into list or profile slices
   */
  createUser: createUserReducer,

  /** Paginated user list with filters and pagination metadata */
  paginatedUsers: paginatedUsersReducer,

  /** Authenticated user's own profile state */
  userSelfProfile: userSelfProfileReducer,

  /** HR/Admin viewed user profile state */
  userViewedProfile: userViewedProfileReducer,
};
