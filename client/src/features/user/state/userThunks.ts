import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  GetPaginatedUsersParams,
  PaginatedUserCardListResponse,
  PaginatedUserListResponse,
  UserProfileResponse,
  UserViewMode,
} from '@features/user/state';
import { userService } from '@services/userService';
import { AppError } from '@utils/AppError';

/**
 * Fetch a paginated list of users from the backend.
 *
 * Supports both `card` and `list` view modes, allowing the backend
 * to return either a lightweight identity payload or a full
 * audit-enabled table payload based on the requested view.
 *
 * Responsibilities:
 * - Delegates data fetching to the user service layer
 * - Supports pagination, sorting, and filtering
 * - Preserves backend pagination metadata
 * - Normalizes API errors into a predictable reject payload
 *   containing `message` and optional `traceId`
 *
 * Concurrency:
 * - Safe for concurrent dispatches (Redux Toolkit handles request lifecycle)
 *
 * @param params - Pagination, sorting, filters, and optional view mode
 * @returns A paginated user response (card or list view)
 */
export const fetchPaginatedUsersThunk = createAsyncThunk<
  PaginatedUserCardListResponse | PaginatedUserListResponse,
  GetPaginatedUsersParams & { viewMode?: UserViewMode }
>(
  'users/fetchPaginatedUsers',
  async (params, { rejectWithValue }) => {
    try {
      return await userService.fetchPaginatedUsers(params);
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message ?? 'Failed to fetch users',
        traceId: error?.traceId,
      });
    }
  }
);

// Define the Thunk
export const fetchUserProfileThunk = createAsyncThunk<
  UserProfileResponse,
  void,
  { rejectValue: string }
>('user/fetchUserProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await userService.fetchUserProfile(); // Fetch the full response
    if (!response || !response.data) {
      throw new AppError('Unexpected response structure', 400);
    }
    return response; // Return the full UserResponse
  } catch (err) {
    if (err instanceof AppError) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue('An unexpected error occurred');
  }
});
