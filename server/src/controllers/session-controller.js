const wrapAsync = require('../utils/wrap-async');
const {
  loginUserService,
  refreshTokenService,
} = require('../services/session-service');
const { extractRequestContext } = require('../utils/request-context');
const { getTtlMs } = require('../utils/auth/jwt-utils');

/**
 * Handles user authentication and session initialization.
 *
 * HTTP boundary for user login.
 * Enforces transport-level security requirements and delegates
 * authentication logic entirely to the service layer.
 *
 * Responsibilities:
 * - Enforce pre-authentication CSRF requirements
 * - Extract credentials from the request body
 * - Extract request metadata via request context utility
 * - Invoke the authentication service
 * - Persist refresh token via secure HTTP-only cookie
 * - Return a stable authentication API response
 *
 * Architectural notes:
 * - Request metadata normalization is delegated to extractRequestContext().
 * - This controller MUST NOT transform authentication data.
 * - The service layer returns API-ready authentication payloads.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 *
 * @returns {Promise<void>}
 */
const loginController = wrapAsync(async (req, res) => {
  const { email, password } = req.body;

  // Pre-auth CSRF token (required before login)
  const csrfToken = req.csrfToken();

  const { ipAddress, userAgent, deviceId, note } = extractRequestContext(req);

  // ------------------------------------------------------------
  // 1. Authenticate user (domain + normalization handled by service)
  // ------------------------------------------------------------
  const result = await loginUserService(email, password, {
    ipAddress,
    userAgent,
    deviceId,
    note,
  });

  // ------------------------------------------------------------
  // 2. Persist refresh token (transport concern only)
  // ------------------------------------------------------------
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  // Prevent caching of auth response
  res.set('Cache-Control', 'no-store');

  // ------------------------------------------------------------
  // 3. Send response
  // ------------------------------------------------------------
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: result.accessToken,
      csrfToken,
      lastLogin: result.lastLogin,
    },
  });
});

/**
 * Handles refresh-token requests and issues a new access token.
 *
 * This controller is the HTTP boundary for token refresh. It:
 * - Reads the refresh token from HTTP-only cookies (transport concern)
 * - Delegates refresh-token validation, rotation, and token issuance to the service layer
 * - Persists the rotated refresh token back into a secure cookie
 * - Returns the new access token in the response body
 *
 * Security model:
 * - This route does NOT require access-token authentication.
 *   It exists specifically to recover from an expired or missing access token.
 * - Refresh-token verification and rotation are enforced by `refreshTokenService`.
 * - Cookie attributes (httpOnly/secure/sameSite/maxAge) are set at the controller layer.
 *
 * Behavior guarantees:
 * - The controller is intentionally thin and deterministic.
 * - Expected token errors are surfaced as domain errors by the service layer
 *   and handled by centralized error middleware (no local try/catch needed).
 *
 * @param {import('express').Request} req
 *   Express request object. Reads refresh token from `req.cookies.refreshToken`.
 * @param {import('express').Response} res
 *   Express response object. Sets rotated refresh token cookie and returns access token.
 *
 * @returns {Promise<void>} Resolves after issuing new tokens and setting cookies
 */
const refreshTokenController = wrapAsync(async (req, res) => {
  // Refresh tokens are stored in HTTP-only cookies
  const refreshToken = req.cookies?.refreshToken;

  const { ipAddress, userAgent } = extractRequestContext(req);

  // Service validates refresh token, rotates it, and issues a new access token
  const { accessToken, refreshToken: newRefreshToken } =
    await refreshTokenService(refreshToken, { ipAddress, userAgent });

  // Persist rotated refresh token (transport concern)
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: getTtlMs('REFRESH_TOKEN_TTL_SECONDS'),
    path: '/',
  });

  res.set('Cache-Control', 'no-store');

  // Return new access token for subsequent authenticated requests
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
    },
    meta: {
      rotatedAt: new Date().toISOString(),
    },
  });
});

module.exports = {
  loginController,
  refreshTokenController,
};
