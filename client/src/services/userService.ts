import {
  GetPaginatedUsersParams,
  PaginatedUserCardListResponse,
  PaginatedUserListResponse,
  UserProfileResponse,
  UserProfileTarget,
  UserViewMode,
} from '@features/user/state';
import { buildQueryString } from '@utils/buildQueryString';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/apiRequest';
import { AppError } from '@utils/error/AppError.tsx';
import { sanitizeString } from '@utils/stringUtils';

/**
 * Fetch a paginated list of users.
 *
 * Endpoint:
 *   GET /users?page={page}&limit={limit}&sortBy={field}&sortOrder={order}&...
 *
 * Returns:
 *   - `PaginatedUserCardListResponse` when `viewMode = 'card'`
 *   - `PaginatedUserListResponse` when `viewMode = 'list'`
 *
 * Notes:
 * - Pagination, sorting, and filters are assumed to be normalized upstream.
 * - Filters are flattened into top-level query params to match the backend API contract.
 * - `viewMode` determines the response projection returned by the server.
 *
 * @param params - Pagination, sorting, view mode, and filter options.
 * @returns A promise resolving to the paginated user response.
 */
const fetchPaginatedUsers = async (
  params: GetPaginatedUsersParams & { viewMode?: UserViewMode } = {}
): Promise<
  PaginatedUserCardListResponse | PaginatedUserListResponse
> => {
  const {
    filters = {},
    viewMode = 'list',
    ...paginationAndSort
  } = params;
  
  // ----------------------------------
  // Flatten query params
  // ----------------------------------
  const queryParams = {
    ...paginationAndSort,
    viewMode,
    ...filters,
  };
  
  // ----------------------------------
  // Build URL
  // ----------------------------------
  const queryString = buildQueryString(queryParams);
  const url = `${API_ENDPOINTS.USERS.ALL_RECORDS}${queryString}`;
  
  // ----------------------------------
  // Execute request
  // ----------------------------------
  return getRequest<
    PaginatedUserCardListResponse | PaginatedUserListResponse
  >(url, {
    policy: 'READ',
  });
};

/**
 * Fetches the authenticated user's own profile.
 *
 * Issues `GET /users/me/profile` and returns the standard API envelope
 * `UserProfileResponse`.
 *
 * Notes:
 * - This endpoint is permission-aware and returns a profile
 *   sliced according to the authenticated user's access scope.
 * - No query parameters are supported.
 *
 * @returns A promise resolving to the authenticated user's profile.
 * @throws {AppError} When the response violates the expected API contract.
 */
const fetchUserProfileSelf = async (): Promise<UserProfileResponse> => {
  const data = await getRequest<UserProfileResponse>(
    API_ENDPOINTS.USERS.PROFILE.SELF
  );
  
  // ------------------------------------------------------------
  // Defensive payload validation (API contract safeguard)
  // ------------------------------------------------------------
  if (!data || typeof data !== 'object') {
    throw AppError.validation(
      'Unexpected response format',
      { response: data }
    );
  }
  
  return data;
};

/**
 * Fetches a user's profile by user ID.
 *
 * Issues `GET /users/:userId/profile` and returns the standard API envelope
 * `UserProfileResponse`.
 *
 * Notes:
 * - Access control is fully enforced server-side.
 * - Returned data is permission-sliced based on the viewer's role.
 *
 * @param userId - Target user UUID string (sanitized before use).
 * @returns A promise resolving to the target user's profile.
 * @throws {AppError} When the response violates the expected API contract.
 */
const fetchUserProfileById = async (
  userId: string
): Promise<UserProfileResponse> => {
  const cleanId = sanitizeString(userId);
  const url = API_ENDPOINTS.USERS.PROFILE.BY_ID(cleanId);
  
  const data = await getRequest<UserProfileResponse>(url);
  
  // ------------------------------------------------------------
  // Defensive payload validation (API contract safeguard)
  // ------------------------------------------------------------
  if (!data || typeof data !== 'object') {
    throw AppError.validation(
      'Unexpected response format',
      { response: data }
    );
  }
  
  return data;
};

/**
 * Core user profile fetcher shared by async thunks.
 *
 * Resolves whether to fetch:
 * - the authenticated user's own profile, or
 * - another user's profile by ID
 *
 * This function centralizes profile-fetching behavior
 * to ensure consistent access patterns and error handling.
 *
 * @param target - Profile fetch target descriptor.
 * @returns A promise resolving to the requested user profile.
 */
const fetchUserProfileCore = async (
  target: UserProfileTarget
): Promise<UserProfileResponse> => {
  if (target.type === 'self') {
    return fetchUserProfileSelf();
  }
  
  return fetchUserProfileById(target.userId);
};

/**
 * User service API.
 *
 * Exposes user-related read operations for thunks and controllers.
 * This layer is transport-focused and contains no business logic.
 */
export const userService = {
  fetchPaginatedUsers,
  fetchUserProfileCore,
};
