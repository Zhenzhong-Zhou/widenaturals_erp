/**
 * @file auth-controller.js
 * @description Contains the logic for authentication routes.
 */

const wrapAsync = require('../utils/wrap-async');
const { logoutService, changePasswordService  } = require('../services/auth-service');
const AppError = require('../utils/AppError');
const { extractRequestContext } = require('../utils/request-context');

/**
 * Handles user logout.
 *
 * This controller is the HTTP boundary for logout intent.
 * It delegates all security-sensitive behavior to the service layer
 * and performs transport-level cleanup by clearing authentication cookies.
 *
 * Responsibilities:
 * - Invoke logout business logic (session + token revocation)
 * - Clear refresh-token cookies (transport concern)
 * - Return a deterministic success response
 *
 * Behavior guarantees:
 * - Logout is idempotent and always succeeds
 * - Missing user, session, or refresh token is NOT an error
 * - Refresh-token cookies are cleared regardless of current state
 *
 * Security model:
 * - Endpoint is protected by CSRF middleware
 * - Refresh tokens are stored in HTTP-only cookies and removed on logout
 * - Access tokens are short-lived and invalidated via session revocation
 *
 * Notes:
 * - Session revocation and audit logging are handled by `logoutService`
 * - No session or token identifiers are exposed to the client
 *
 * @param {import('express').Request} req
 *   Express request object. May include authenticated user/session context.
 * @param {import('express').Response} res
 *   Express response object used for cookie cleanup and response.
 *
 * @returns {Promise<void>}
 */
const logoutController = wrapAsync(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const {
    ipAddress,
    userAgent,
  } = extractRequestContext(req);
  
  /**
   * Delegate logout semantics to the service layer.
   *
   * The service is responsible for:
   * - Revoking the active session (if present)
   * - Revoking all tokens associated with that session
   * - Recording audit / security logs
   *
   * Absence of auth context is treated as a no-op.
   */
  await logoutService({
    userId: req.auth?.user?.id ?? null,
    sessionId: req.auth?.sessionId ?? null,
  },{ ipAddress, userAgent });
  
  /**
   * Clear refresh-token cookie (transport-level concern).
   *
   * This operation is intentionally idempotent and safe
   * even if the cookie does not exist.
   */
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
  
  // Deterministic success response
  res.status(200).json({
    success: true,
    message: 'Logout successful',
    data: null,
  });
});

/**
 * POST /auth/change-password
 *
 * Changes the password of the currently authenticated user.
 *
 * This endpoint performs a security-critical password mutation and
 * revokes all active sessions and tokens associated with the user.
 *
 * ─────────────────────────────────────────────────────────────
 * Security characteristics
 * ─────────────────────────────────────────────────────────────
 * - Requires prior authentication
 * - Verifies the user's current password
 * - Enforces the configured password strength policy
 * - Prevents password reuse based on stored history
 * - Revokes all active sessions
 * - Revokes all access and refresh tokens
 * - Forces re-authentication across all devices
 *
 * ─────────────────────────────────────────────────────────────
 * Request body
 * ─────────────────────────────────────────────────────────────
 * {
 *   currentPassword: string, // Existing password
 *   newPassword: string      // New password (policy-enforced)
 * }
 *
 * ─────────────────────────────────────────────────────────────
 * Successful response (200)
 * ─────────────────────────────────────────────────────────────
 * {
 *   success: true,
 *   changedAt: string,       // ISO 8601 timestamp
 *   message: string
 * }
 *
 * Notes:
 * - After a successful password change, the client must log in again.
 * - Any existing refresh token cookie is cleared by the controller.
 */
const changePasswordController = wrapAsync(async (req, res) => {
  const userId = req.auth.user.id;
  const { currentPassword, newPassword } = req.body;
  
  // Transport-level validation
  if (!currentPassword || !newPassword) {
    throw AppError.validationError(
      'Both current and new passwords are required.'
    );
  }
  
  // All security invariants handled in service
  await changePasswordService(
    userId,
    currentPassword,
    newPassword
  );
  
  // Clear refresh token cookie (force re-auth)
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  
  return res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
    data: {
      changedAt: new Date().toISOString(),
    },
  });
});

// todo /auth/forgot-password

module.exports = {
  logoutController,
  changePasswordController,
};
