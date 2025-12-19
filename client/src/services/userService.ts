import {
  GetPaginatedUsersParams,
  PaginatedUserCardListResponse,
  PaginatedUserListResponse,
  UserProfileResponse,
  UserViewMode,
} from '@features/user/state';
import { buildQueryString } from '@utils/buildQueryString';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/apiRequest';
import axiosInstance from '@utils/axiosConfig';
import { clearTokens } from '@utils/tokenManager';
import { handleError, mapErrorMessage } from '@utils/errorUtils';
import { AppError, ErrorType } from '@utils/AppError';
import { isCustomAxiosError } from '@utils/axiosUtils';
import { withTimeout } from '@utils/timeoutUtils';
import { withRetry } from '@utils/retryUtils';

/**
 * Fetch a paginated list of users.
 *
 * Issues:
 *   GET /users?page={page}&limit={limit}&sortBy={field}&sortOrder={order}&...
 *
 * Returns the standard paginated envelope:
 *   PaginatedResponse<UserCardView | UserListView>
 *
 * Notes:
 * - Query parameters should already be normalized
 *   (pagination, sorting, filters, date ranges).
 * - Filters are flattened to top-level query parameters to
 *   match backend Joi schema expectations.
 * - `viewMode` determines whether card or list view data is returned.
 *
 * @param params - Pagination, sorting, view mode, and filter options.
 * @returns A promise resolving to the paginated user response.
 * @throws Rethrows any error from the request helper.
 *
 * @example
 * const res = await fetchPaginatedUsers({
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc',
 *   viewMode: 'list',
 *   filters: {
 *     roleIds: ['985305ce-4c0d-4a35-b662-eb40ebe9e20a'],
 *     keyword: 'admin',
 *   },
 * });
 *
 * console.log(res.data[0].fullName);
 */
const fetchPaginatedUsers = async (
  params: GetPaginatedUsersParams & { viewMode?: UserViewMode } = {}
): Promise<PaginatedUserCardListResponse | PaginatedUserListResponse> => {
  const {
    filters = {},
    viewMode = 'list',
    ...rest
  } = params;
  
  // ----------------------------------
  // Flatten filters for query string
  // ----------------------------------
  const flatParams = {
    ...rest,
    viewMode,
    ...filters,
  };
  
  // ----------------------------------
  // Build request URL
  // ----------------------------------
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.USERS.ALL_RECORDS}${queryString}`;
  
  try {
    return await getRequest<PaginatedUserCardListResponse | PaginatedUserListResponse>(url);
  } catch (error) {
    console.error('Failed to fetch paginated users:', {
      params,
      error,
    });
    throw error;
  }
};

/**
 * Fetches the authenticated user's profile.
 *
 * @returns {Promise<UserProfileResponse>} - The user's profile data.
 * @throws {AppError} - If the request fails or returns an unexpected response.
 */
const fetchUserProfile = async (): Promise<UserProfileResponse> => {
  try {
    const fetchProfile = () =>
      axiosInstance.get<UserProfileResponse>(API_ENDPOINTS.USER_PROFILE);

    // Add retry and timeout logic
    const response = await withTimeout(
      withRetry(
        fetchProfile,
        3,
        1000,
        'Failed to fetch user profile after retries'
      ), // Retry with delay
      5000, // Timeout in milliseconds
      'Fetching user profile timed out'
    );

    // Validate response structure
    if (!response.data || typeof response.data !== 'object') {
      throw new AppError('Unexpected response format', 400, {
        type: ErrorType.ValidationError,
        details: response.data,
      });
    }

    return response.data;
  } catch (err: unknown) {
    // Handle 401 Unauthorized
    if (isCustomAxiosError(err) && err.response?.status === 401) {
      clearTokens(); // Clear tokens for unauthorized errors
      throw new AppError('Unauthorized. Please log in again.', 401, {
        type: ErrorType.AuthenticationError,
      });
    }

    // Handle all other errors
    const mappedError = mapErrorMessage(err);
    handleError(mappedError);
    throw mappedError;
  }
};

/**
 * Exported user service object.
 */
export const userService = {
  fetchPaginatedUsers,
  fetchUserProfile,
};
