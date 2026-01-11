import { createAsyncThunk } from '@reduxjs/toolkit';
import { authorizeService } from '@services/authorizeService';
import { extractUiErrorPayload } from '@utils/error';
import { UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Fetches the current user's role and permission set.
 *
 * Purpose:
 * - Initializes permission-aware UI state after authentication.
 * - Enables conditional rendering, route guards, and action-level ACL checks.
 *
 * Behavior:
 * - Delegates the request to the authorization service layer.
 * - Resolves with a stable permission payload `{ roleName, permissions }`.
 * - Rejects with a normalized UI-safe error payload on failure.
 *
 * Error handling:
 * - All thrown errors are converted via `extractUiErrorPayload`
 *   to ensure reducers and UI components never handle raw exceptions.
 *
 * Architectural notes:
 * - This thunk performs no permission logic or transformation.
 * - It must remain free of routing, navigation, or UI side effects.
 * - Safe to call during app bootstrap or session rehydration.
 */
export const fetchPermissionsThunk = createAsyncThunk<
  { roleName: string; permissions: string[] },
  void,
  { rejectValue: UiErrorPayload }
>('permissions/fetch', async (_, { rejectWithValue }) => {
  try {
    return await authorizeService.fetchPermissions();
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});
