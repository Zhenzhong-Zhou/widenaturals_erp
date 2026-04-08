/**
 * @file session-controller.js
 * @module controllers/session-controller
 *
 * @description
 * Controllers for authentication and session management.
 *
 * Routes:
 *   POST /api/v1/auth/login    → loginController
 *   POST /api/v1/auth/refresh  → refreshTokenController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Transport concerns handled here (not in service layer):
 *   - HTTP-only refresh token cookie (set and rotated)
 *   - Cache-Control: no-store header on all auth responses
 *   - CSRF token generation via req.csrfToken()
 *
 * Note:
 *   Both session-controller and auth-controller import exclusively from
 *   auth-service. session-service is an internal dependency of auth-service
 *   and is never imported directly by controllers.
 *
 *   extractRequestContext is called directly in these controllers because
 *   auth middleware has not yet run at login/refresh time. req.auth is not
 *   available. attachTraceId middleware does run first, so req.traceId is safe.
 */

'use strict';

const { wrapAsyncHandler }      = require('../middlewares/async-handler');
const {
  loginUserService,
  refreshTokenService,
} = require('../services/auth-service');
const { extractRequestContext } = require('../utils/request-context');
const { getTtlMs }              = require('../utils/auth/jwt-utils');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticates a user and issues access + refresh tokens.
 *
 * Refresh token is persisted in an HTTP-only cookie.
 * Access token and CSRF token are returned in the response body.
 *
 * Requires: CSRF middleware (req.csrfToken()), Joi body validation.
 */
const loginController = wrapAsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // CSRF token must be issued at login and forwarded to the client
  // for inclusion in subsequent state-changing requests
  const csrfToken = req.csrfToken();
  
  // extractRequestContext is called directly — auth middleware has not run yet
  const { ipAddress, userAgent, deviceId, parsedUserAgent } = extractRequestContext(req);
  
  const result = await loginUserService(email, password, {
    ipAddress,
    userAgent,
    deviceId,
    parsedUserAgent,
  });
  
  // Refresh token stored in HTTP-only cookie — never exposed to JS
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   getTtlMs('REFRESH_TOKEN_TTL_SECONDS'),
    path:     '/',
  });
  
  // Prevent auth responses from being cached at any layer
  res.set('Cache-Control', 'no-store');
  
  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      accessToken: result.accessToken,
      csrfToken,
      lastLogin:   result.lastLogin,
    },
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rotates the refresh token and issues a new access token.
 *
 * Refresh token is read from the HTTP-only cookie and rotated on every call.
 * The new refresh token is persisted back into the cookie.
 *
 * Requires: CSRF middleware, valid refreshToken cookie.
 */
const refreshTokenController = wrapAsyncHandler(async (req, res) => {
  // Refresh token is stored in HTTP-only cookie — not in the request body
  const refreshToken = req.cookies?.refreshToken;
  
  // extractRequestContext is called directly — auth middleware has not run yet
  const { ipAddress, userAgent } = extractRequestContext(req);
  
  const { accessToken, refreshToken: newRefreshToken } =
    await refreshTokenService(refreshToken, { ipAddress, userAgent });
  
  // Persist rotated refresh token — old token is invalidated by the service
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge:   getTtlMs('REFRESH_TOKEN_TTL_SECONDS'),
    path:     '/',
  });
  
  res.set('Cache-Control', 'no-store');
  
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully.',
    data: {
      accessToken,
    },
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  loginController,
  refreshTokenController,
};
