import type { ResetPasswordResponse } from '@features/resetPassword';
import { AppError } from '@utils/error/AppError.tsx';
import { postRequest } from '@utils/apiRequest';
import { API_ENDPOINTS } from '@services/apiEndpoints';

/**
 * Resets the authenticated user's password.
 *
 * Issues:
 *   POST /auth/reset-password
 *
 * Characteristics:
 * - State-changing (non-idempotent)
 * - Must NOT be retried
 * - Transport errors are normalized upstream
 *
 * @param currentPassword - The user's current password (optional).
 * @param newPassword - The new password to be set.
 *
 * @returns A promise resolving to the reset password result.
 *
 * @throws {AppError}
 * - Validation error if input is invalid
 * - Server error if response payload is malformed
 */
export const resetPassword = async (
  currentPassword: string | null,
  newPassword: string
): Promise<ResetPasswordResponse> => {
  /* --------------------------------------------------------
   * Domain validation
   * ------------------------------------------------------ */
  if (!newPassword) {
    throw AppError.validation(
      'New password is required'
    );
  }
  
  const payload = {
    currentPassword,
    newPassword,
  };
  
  /* --------------------------------------------------------
   * Transport (POST, non-retryable)
   * ------------------------------------------------------ */
  const data = await postRequest<
    { currentPassword: string | null; newPassword: string },
    ResetPasswordResponse
  >(
    API_ENDPOINTS.SECURITY.AUTH.RESET_PASSWORD,
    payload
  );
  
  /* --------------------------------------------------------
   * Defensive payload validation
   * ------------------------------------------------------ */
  if (!data || typeof data !== 'object') {
    throw AppError.server(
      'Invalid reset password response payload',
      { response: data }
    );
  }
  
  return data;
};

/**
 * Reset password service.
 */
export const resetPasswordService = {
  resetPassword,
};
