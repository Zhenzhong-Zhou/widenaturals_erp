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
import { extractUiErrorPayload, extractErrorMessage } from '@utils/error';

/**
 * createUserThunk
 *
 * Dispatches a POST /users request to create a new user.
 *
 * Responsibilities:
 * - Invoke the client API write operation
 * - Return transport-safe response data on success
 * - Surface normalized, UI-safe error payloads to reducers
 *
 * Error contract:
 * - On failure, rejects with a UI-safe error payload produced by
 *   `extractUiErrorPayload`
 * - Reducers should not assume raw Error or Axios shapes
 *
 * Side effects:
 * - Non-idempotent (creates a new server-side resource)
 *
 * MUST NOT:
 * - Perform request validation
 * - Perform authorization or permission checks
 * - Transform or interpret domain/business logic
 */
export const createUserThunk = createAsyncThunk<
  CreateUserResponse,
  CreateUserRequest,
  {
    rejectValue: ReturnType<typeof extractUiErrorPayload>;
  }
>('users/createUser', async (payload, { rejectWithValue }) => {
  try {
    return await userService.createUser(payload);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Redux Toolkit Thunk — Fetch paginated users (UI-normalized).
 *
 * Fetches users from the backend using the requested view mode
 * (`card` or `list`), then flattens the result into a single,
 * UI-ready user record shape before storing it in Redux.
 *
 * Responsibilities:
 * - Delegate data fetching to the user service layer
 * - Support pagination, sorting, filtering, and view mode selection
 * - Transform API user views into `FlattenedUserRecord`
 * - Return a stable, UI-safe paginated response
 *
 * @param params - Pagination, sorting, filters, and optional view mode
 * @returns Paginated UI response with flattened user records
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
