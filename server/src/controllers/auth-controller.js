/**
 * @file auth-controller.js
 * @description Contains the logic for authentication routes.
 */

const wrapAsync = require('../utils/wrap-async');
const { logoutService, changePasswordService  } = require('../services/auth-service');

/**
 * Handles user logout.
 *
 * This controller represents the HTTP boundary for logout intent.
 * It delegates audit and session-related behavior to the service layer
 * and performs transport-level cleanup by clearing authentication cookies.
 *
 * Behavior guarantees:
 * - Logout is idempotent and always succeeds.
 * - Absence of an active session or refresh token is NOT treated as an error.
 * - Refresh token cookies are cleared regardless of current state.
 *
 * Security model:
 * - Logout endpoints are protected by CSRF middleware.
 * - Refresh tokens are stored in HTTP-only cookies and removed on logout.
 *
 * Notes:
 * - Business logging and audit concerns are handled in `logoutService`.
 * - No timestamps are returned; logout timing is recorded via structured logs.
 *
 * @param {import('express').Request} req
 *   Express request object. May include authenticated user context.
 * @param {import('express').Response} res
 *   Express response object used to clear cookies and return status.
 *
 * @returns {Promise<void>}
 */
const logoutController = wrapAsync(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Record logout intent (audit / future revocation handled in service)
  await logoutService(req.user);
  
  // Clear refresh token cookie (idempotent)
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
  });
  
  // Always return success
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * POST /auth/change-password
 *
 * Changes the password of the currently authenticated user.
 *
 * This endpoint performs an authenticated password change and
 * invalidates existing refresh tokens to force re-authentication
 * on subsequent requests.
 *
 * ─────────────────────────────────────────────────────────────
 * Security characteristics
 * ─────────────────────────────────────────────────────────────
 * - Requires prior authentication
 * - Verifies the user's current password
 * - Enforces the configured password policy
 * - Prevents password reuse based on history
 * - Invalidates existing refresh tokens
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
 *   changedAt: string,       // ISO timestamp
 *   message: string
 * }
 */
const changePasswordController = wrapAsync(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  
  // All security invariants are enforced within the service layer
  await changePasswordService(userId, currentPassword, newPassword);
  
  // Invalidate existing refresh tokens to force re-authentication
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
  
  return res.status(200).json({
    success: true,
    changedAt: new Date().toISOString(),
    message: 'Password changed successfully.',
  });
});

// todo /auth/forgot-password

module.exports = {
  logoutController,
  changePasswordController,
};
