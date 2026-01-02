import type {
  GetPaginatedUsersParams,
  PaginatedUserCardListResponse,
  PaginatedUserListResponse,
  UserProfileResponse,
  UserProfileTarget,
  UserViewMode,
} from '@features/user/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { buildQueryString } from '@utils/buildQueryString';
import { getRequest } from '@utils/http';
import { sanitizeString } from '@utils/stringUtils';

/* =========================================================
 * Users
 * ======================================================= */

/**
 * Fetch paginated users with optional filters and view mode.
 *
 * READ-only.
 */
const fetchPaginatedUsers = (
  params: GetPaginatedUsersParams & { viewMode?: UserViewMode } = {}
): Promise<PaginatedUserCardListResponse | PaginatedUserListResponse> => {
  const { filters = {}, viewMode = 'list', ...paginationAndSort } = params;

  const queryString = buildQueryString({
    ...paginationAndSort,
    viewMode,
    ...filters,
  });

  return getRequest<PaginatedUserCardListResponse | PaginatedUserListResponse>(
    `${API_ENDPOINTS.USERS.ALL_RECORDS}${queryString}`,
    {
      policy: 'READ',
    }
  );
};

/* =========================================================
 * User Profiles
 * ======================================================= */

/**
 * Fetch the authenticated user's profile.
 *
 * READ-only.
 */
const fetchUserProfileSelf = (): Promise<UserProfileResponse> =>
  getRequest<UserProfileResponse>(API_ENDPOINTS.USERS.PROFILE.SELF, {
    policy: 'READ',
  });

/**
 * Fetch a user's profile by ID.
 *
 * READ-only, permission-sliced server-side.
 */
const fetchUserProfileById = (userId: string): Promise<UserProfileResponse> => {
  const cleanId = sanitizeString(userId);

  return getRequest<UserProfileResponse>(
    API_ENDPOINTS.USERS.PROFILE.BY_ID(cleanId),
    { policy: 'READ' }
  );
};

/* =========================================================
 * Core Profile Resolver
 * ======================================================= */

/**
 * Resolve and fetch a user profile based on target type.
 *
 * Used by async thunks to centralize profile access logic.
 */
const fetchUserProfileCore = (
  target: UserProfileTarget
): Promise<UserProfileResponse> =>
  target.type === 'self'
    ? fetchUserProfileSelf()
    : fetchUserProfileById(target.userId);

/* =========================================================
 * Public API
 * ======================================================= */

export const userService = {
  fetchPaginatedUsers,
  fetchUserProfileCore,
};
