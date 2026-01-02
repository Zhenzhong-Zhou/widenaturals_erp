import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  GetPaginatedUsersParams,
  PaginatedUserCardListResponse,
  PaginatedUserListResponse,
  UserProfileResponse,
  UserViewMode,
} from '@features/user/state';
import { userService } from '@services/userService';
import { extractUiErrorPayload, extractErrorMessage } from '@utils/error';

/**
 * Fetch a paginated list of users from the backend.
 *
 * Supports both `card` and `list` view modes, allowing the backend
 * to return either:
 * - a lightweight identity projection (card view), or
 * - a full audit-enabled table projection (list view)
 *
 * Responsibilities:
 * - Delegates data fetching to the user service layer
 * - Supports pagination, sorting, filtering, and view mode selection
 * - Preserves backend pagination metadata without transformation
 * - Normalizes API errors into a structured UI-safe payload
 *   containing `message` and optional `traceId`
 *
 * Concurrency:
 * - Safe for concurrent dispatches; request lifecycle is managed
 *   by Redux Toolkit.
 *
 * @param params - Pagination, sorting, filters, and optional view mode
 * @returns A paginated user response whose shape is determined by `viewMode`
 */
export const fetchPaginatedUsersThunk = createAsyncThunk<
  PaginatedUserCardListResponse | PaginatedUserListResponse,
  GetPaginatedUsersParams & { viewMode?: UserViewMode },
  { rejectValue: { message: string; traceId?: string } }
>('users/fetchPaginatedUsers', async (params, { rejectWithValue }) => {
  try {
    return await userService.fetchPaginatedUsers(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetch the authenticated user's own profile.
 *
 * Issues a permission-aware request that returns the profile
 * of the currently authenticated user, sliced according to
 * server-side access rules.
 *
 * Responsibilities:
 * - Delegates profile retrieval to the user service layer
 * - Handles only "self" profile access (no parameters)
 * - Normalizes errors into a string reject payload
 *
 * @returns The authenticated user's profile
 * @throws Rejects with a user-friendly error message string
 */
export const fetchUserSelfProfileThunk = createAsyncThunk<
  UserProfileResponse,
  void,
  { rejectValue: string }
>('userSelfProfile/fetch', async (_, { rejectWithValue }) => {
  try {
    return await userService.fetchUserProfileCore({ type: 'self' });
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

/**
 * Fetch a user's profile by user ID for privileged views (e.g. HR/Admin).
 *
 * Access control is fully enforced server-side. The returned profile
 * is permission-sliced based on the viewer's role and scope.
 *
 * Responsibilities:
 * - Delegates profile retrieval to the user service layer
 * - Supports route-driven profile views via user ID
 * - Normalizes errors into a string reject payload
 *
 * @param userId - Target user UUID
 * @returns The requested user's profile
 * @throws Rejects with a user-friendly error message string
 */
export const fetchUserViewedProfileThunk = createAsyncThunk<
  UserProfileResponse,
  string,
  { rejectValue: string }
>('userViewedProfile/fetch', async (userId, { rejectWithValue }) => {
  try {
    return await userService.fetchUserProfileCore({ type: 'byId', userId });
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});
