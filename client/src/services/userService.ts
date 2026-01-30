import type {
  CreateUserRequest, CreateUserResponse,
  GetPaginatedUsersParams,
  PaginatedUserCardListsApiResponse,
  PaginatedUserListsApiResponse,
  UserProfileResponse,
  UserProfileTarget,
  UserViewMode,
} from '@features/user/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { buildQueryString } from '@utils/buildQueryString';
import { getRequest, postRequest } from '@utils/http';
import { sanitizeString } from '@utils/stringUtils';

/* =========================================================
 * Users
 * ======================================================= */

/**
 * Create a new user.
 *
 * WRITE operation.
 *
 * Responsibilities:
 * - Send validated user creation payload to the API
 * - Return the created user summary
 *
 * Notes:
 * - Authorization and business rules are enforced server-side
 * - Errors are propagated to the caller for handling
 */
const createUser = (
  payload: CreateUserRequest
): Promise<CreateUserResponse> => {
  return postRequest<CreateUserRequest, CreateUserResponse>(
    API_ENDPOINTS.USERS.ADD_NEW_RECORD,
    payload,
    {
      policy: 'WRITE',
    }
  );
};

/**
 * Fetch paginated users from the backend.
 *
 * READ-only API call.
 * The response shape depends on `viewMode` and is intentionally
 * not normalized at this layer.
 */
const fetchPaginatedUsers = (
  params: GetPaginatedUsersParams & { viewMode?: UserViewMode } = {}
): Promise<
  PaginatedUserCardListsApiResponse |
  PaginatedUserListsApiResponse
> => {
  const { filters = {}, viewMode = 'list', ...paginationAndSort } = params;

  const queryString = buildQueryString({
    ...paginationAndSort,
    viewMode,
    ...filters,
  });

  return getRequest<
    PaginatedUserCardListsApiResponse |
    PaginatedUserListsApiResponse
  >(
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
  createUser,
  fetchPaginatedUsers,
  fetchUserProfileCore,
};
