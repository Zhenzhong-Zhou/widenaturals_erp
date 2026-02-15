import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '@features/auth/password/state/';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error';
import { authenticateService } from '@services/authenticateService';

/**
 * Authenticated password change flow.
 *
 * Endpoint:
 *   POST /auth/change-password
 *
 * Characteristics:
 * - Requires valid authenticated session
 * - Non-idempotent (modifies credential state)
 * - Rotates credential hash in persistence layer
 * - Invalidates all active refresh tokens for the user
 * - Forces session re-authentication on success
 *
 * Security Guarantees:
 * - Verifies current password against stored hash
 * - Enforces password policy validation
 * - Prevents password reuse (if enabled at service layer)
 * - Triggers session lifecycle revocation
 *
 * Client Behavior:
 * - On success: user must be logged out and redirected to login
 * - On failure: structured UI-safe error returned via rejectValue
 *
 * Returns:
 *   ApiSuccessResponse<ChangePasswordData>
 *
 * Rejects:
 *   UiErrorPayload
 */
export const changePasswordThunk = createAsyncThunk<
  ChangePasswordResponse,
  ChangePasswordRequest,
  { rejectValue: UiErrorPayload }
>('auth/changePassword', async (payload, { rejectWithValue }) => {
  try {
    return await authenticateService.changePassword(payload);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});
