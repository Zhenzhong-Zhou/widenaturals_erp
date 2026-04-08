/**
 * @file auth-controller.js
 * @module controllers/auth-controller
 *
 * @description
 * Controllers for authentication lifecycle operations.
 *
 * Routes:
 *   POST  /api/v1/auth/logout           → logoutController
 *   PATCH /api/v1/auth/change-password  → changePasswordController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Transport concerns handled here (not in service layer):
 *   - Refresh token cookie cleared on logout and password change
 *   - Cookie config (httpOnly, secure, sameSite) resolved from NODE_ENV
 *
 * Note:
 *   Both session-controller and auth-controller import exclusively from
 *   auth-service. session-service is an internal dependency of auth-service
 *   and is never imported directly by controllers.
 *
 *   The auth domain is split across two controller/route pairs due to
 *   middleware boundaries — login and refresh are public endpoints that
 *   cannot share a route file with authenticated operations.
 *
 *   extractRequestContext is called directly in logoutController because
 *   the auth session may be partially invalidated at this point.
 *   req.traceId is safe — attachTraceId runs before auth middleware.
 */

'use strict';

const { wrapAsyncHandler }      = require('../middlewares/async-handler');
const {
  logoutService,
  changePasswordService,
} = require('../services/auth-service');
const { extractRequestContext } = require('../utils/request-context');

// Resolved once at module load — used by both controllers for cookie config
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Terminates the authenticated session and clears the refresh token cookie.
 *
 * extractRequestContext is called directly — auth session may be partially
 * invalidated at this point so req.auth cannot be fully trusted.
 *
 * Requires: CSRF middleware.
 */
const logoutController = wrapAsyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = extractRequestContext(req);
  
  await logoutService(
    {
      userId:    req.auth?.user?.id    ?? null,
      sessionId: req.auth?.sessionId   ?? null,
    },
    { ipAddress, userAgent },
  );
  
  // Clear refresh token — client must re-authenticate after logout
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    path:     '/',
  });
  
  res.status(200).json({
    success: true,
    message: 'Logout successful.',
    data:    null,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Changes the authenticated user's password and forces re-authentication.
 *
 * Refresh token is cleared — client must log in again with the new password.
 * All security invariants (current password verification, strength rules)
 * are enforced in the service layer.
 *
 * Requires: auth middleware, Joi body validation.
 */
const changePasswordController = wrapAsyncHandler(async (req, res) => {
  const { id: userId }                    = req.auth.user;
  const { currentPassword, newPassword }  = req.body;
  
  await changePasswordService(userId, currentPassword, newPassword);
  
  // Clear refresh token — forces re-authentication with new credentials
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   IS_PRODUCTION,
    sameSite: 'strict',
    path:     '/',
  });
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
    data:    { changedAt: new Date().toISOString() },
    traceId: req.traceId,
  });
});

// todo /auth/forgot-password

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  logoutController,
  changePasswordController,
};
