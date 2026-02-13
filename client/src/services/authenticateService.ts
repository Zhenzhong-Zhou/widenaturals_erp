import {
  ChangePasswordRequest,
  ChangePasswordResponse
} from '@features/auth/password/state/authTypes';
import { postRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error';

/* =========================================================
 * Change Password
 * ======================================================= */


/**
 * Changes the authenticated user's password.
 *
 * POST /auth/change-password
 *
 * - Non-idempotent
 * - WRITE-only operation
 * - Transport and HTTP errors normalized by `postRequest`
 */
export const changePassword = async (
  payload: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  const { currentPassword, newPassword } = payload;
  
  if (!currentPassword) {
    throw AppError.validation('Current password is required');
  }
  
  if (!newPassword) {
    throw AppError.validation('New password is required');
  }
  
  return postRequest<ChangePasswordRequest, ChangePasswordResponse>(
    API_ENDPOINTS.SECURITY.AUTH.CHANGE_PASSWORD,
    payload,
    { policy: 'AUTH' }
  );
};

/* =========================================================
 * Public API
 * ======================================================= */

export const authenticateService = {
  changePassword,
};
