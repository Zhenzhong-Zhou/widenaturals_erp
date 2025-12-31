import type { ResetPasswordResponse } from '@features/resetPassword';
import { postRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error';

/* =========================================================
 * Reset Password
 * ======================================================= */

/**
 * Resets the authenticated user's password.
 *
 * POST /auth/reset-password
 *
 * - Non-idempotent
 * - WRITE-only operation
 * - Transport and HTTP errors normalized by `postRequest`
 */
const resetPassword = async (
  currentPassword: string | null,
  newPassword: string
): Promise<ResetPasswordResponse> => {
  if (!newPassword) {
    throw AppError.validation('New password is required');
  }
  
  return postRequest<
    { currentPassword: string | null; newPassword: string },
    ResetPasswordResponse
  >(
    API_ENDPOINTS.SECURITY.AUTH.RESET_PASSWORD,
    { currentPassword, newPassword },
    { policy: 'AUTH' }
  );
};

/* =========================================================
 * Public API
 * ======================================================= */

export const resetPasswordService = {
  resetPassword,
};
