/**
 * ================================================================
 * User Thunks Module
 * ================================================================
 *
 * Responsibility:
 * - Orchestrates asynchronous user workflows.
 * - Serves as the boundary between UI and userService.
 *
 * Scope:
 * - Create users
 * - Fetch paginated user lists
 * - Fetch authenticated user profile
 * - Fetch user profiles by ID
 *
 * Architecture:
 * - API calls delegated to userService
 * - UI normalization occurs at the thunk boundary where required
 * - Redux reducers remain pure and state-focused
 *
 * Error Model:
 * - All failures return `UiErrorPayload`
 * - Errors are normalized via `extractUiErrorPayload`
 * ================================================================
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateUserRequest,
  CreateUserResponse,
  GetPaginatedUsersParams,
  PaginatedUsersUiResponse,
  UserProfileResponse,
  UserViewMode,
} from '@features/user/state';
import { userService } from '@services/userService';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { flattenUserRecords } from '@features/user/utils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Creates a new user.
 *
 * Responsibilities:
 * - Calls userService.createUser
 * - Sends user creation payload
 * - Returns API response containing created user data
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param payload - User creation input
 */
export const createUserThunk = createAsyncThunk<
  CreateUserResponse,
  CreateUserRequest,
  { rejectValue: UiErrorPayload }
>('users/createUser', async (payload, { rejectWithValue }) => {
  try {
    return await userService.createUser(payload);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetches a paginated list of users and converts
 * API records into UI-ready rows.
 *
 * Responsibilities:
 * - Calls userService.fetchPaginatedUsers
 * - Flattens domain user models before entering Redux state
 * - Preserves pagination metadata
 *
 * Transformation Boundary:
 * - Raw user models → flattenUserRecords → UI models
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param params - Pagination, sorting, filtering, and optional view mode
 */
export const fetchPaginatedUsersThunk = createAsyncThunk<
  PaginatedUsersUiResponse,
  GetPaginatedUsersParams & { viewMode?: UserViewMode },
  { rejectValue: UiErrorPayload }
>('users/fetchPaginatedUsers', async (params, { rejectWithValue }) => {
  try {
    const response = await userService.fetchPaginatedUsers(params);

    return {
      ...response,
      data: flattenUserRecords(response.data),
    };
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetches the authenticated user's profile.
 *
 * Responsibilities:
 * - Calls userService.fetchUserProfileCore with self context
 * - Returns the current user's profile data
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 */
export const fetchUserSelfProfileThunk = createAsyncThunk<
  UserProfileResponse,
  void,
  { rejectValue: UiErrorPayload }
>('userSelfProfile/fetch', async (_, { rejectWithValue }) => {
  try {
    return await userService.fetchUserProfileCore({ type: 'self' });
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetches a user's profile by ID.
 *
 * Responsibilities:
 * - Calls userService.fetchUserProfileCore
 * - Retrieves profile data for the specified user
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param userId - Target user UUID
 */
export const fetchUserViewedProfileThunk = createAsyncThunk<
  UserProfileResponse,
  string,
  { rejectValue: UiErrorPayload }
>('userViewedProfile/fetch', async (userId, { rejectWithValue }) => {
  try {
    return await userService.fetchUserProfileCore({ type: 'byId', userId });
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});
