import {
  ApiSuccessResponse,
  AsyncState
} from '@shared-types/api';

/**
 * Data payload returned after a successful password change.
 *
 * This object is wrapped inside {@link ApiSuccessResponse}.
 */
export interface ChangePasswordData {
  /**
   * ISO timestamp indicating when the password
   * was successfully changed on the server.
   *
   * Useful for:
   * - Audit display
   * - UI confirmation metadata
   * - Security activity history
   */
  changedAt: string;
}

/**
 * API response shape for POST /auth/change-password.
 *
 * Structure:
 * {
 *   success: true,
 *   message: string,
 *   data: {
 *     changedAt: string
 *   },
 *   traceId: string
 * }
 *
 * Notes:
 * - This endpoint is non-idempotent.
 * - On success, the backend invalidates active sessions.
 * - Client should redirect to login.
 */
export type ChangePasswordResponse =
  ApiSuccessResponse<ChangePasswordData>;

/**
 * Request payload for authenticated password change.
 *
 * Endpoint:
 * POST /auth/change-password
 *
 * Security:
 * - Requires valid session
 * - Requires CSRF protection
 * - Current password must match stored hash
 * - New password must pass password policy validation
 */
export interface ChangePasswordRequest {
  /**
   * The user's current password.
   *
   * Required for verification before allowing change.
   */
  currentPassword: string;
  
  /**
   * The new password to replace the current one.
   *
   * Must satisfy:
   * - Length constraints
   * - Complexity rules
   * - Non-reuse policy (if enforced server-side)
   */
  newPassword: string;
}

/**
 * Redux slice state for the change password workflow.
 *
 * Follows standardized AsyncState pattern.
 *
 * State lifecycle:
 * - data: null → while idle or after reset
 * - loading: true → during request
 * - error: populated if request fails
 * - data: populated on success
 */
export type ChangePasswordState =
  AsyncState<ChangePasswordData | null>;
