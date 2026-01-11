const wrapAsync = require('../utils/wrap-async');
const { loginUserService, refreshTokenService } = require('../services/session-service');
const { transformLoginResponse } = require('../transformers/session-transformer');

/**
 * Handles user authentication and session initialization.
 *
 * This controller implements the HTTP boundary for user login.
 * It validates request input, enforces the pre-authentication CSRF model,
 * delegates credential verification and transactional state updates to
 * the service layer, and constructs a stable API response.
 *
 * Security model:
 * - Login requests are protected by CSRF middleware (pre-auth CSRF).
 * - A valid CSRF token MUST be present before authentication is attempted.
 * - Refresh tokens are issued by the service layer and persisted in
 *   secure, HTTP-only cookies at the transport layer.
 *
 * Workflow:
 * 1. Extract credentials from the request body.
 * 2. Retrieve the CSRF token (required before login).
 * 3. Invoke the authentication service to:
 *    - Verify credentials
 *    - Enforce lockout rules
 *    - Update login metadata
 *    - Issue access and refresh tokens
 * 4. Normalize the domain result into a stable API response shape.
 * 5. Persist the refresh token in a secure cookie.
 * 6. Return a successful authentication response.
 *
 * Response shape:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     accessToken: string,
 *     csrfToken: string,
 *     lastLogin: string | null
 *   }
 * }
 *
 * Error handling:
 * - Expected authentication and validation errors are propagated
 *   via centralized error middleware.
 * - Unexpected system errors are captured and reported consistently.
 *
 * @param {import('express').Request} req
 *   Express request object. Expects `email` and `password` in `req.body`.
 * @param {import('express').Response} res
 *   Express response object used to set cookies and return the API payload.
 *
 * @returns {Promise<void>}
 *   Resolves after the HTTP response has been sent.
 */
const loginController = wrapAsync(async (req, res) => {
  const { email, password } = req.body;
  
  // Retrieve CSRF token (required before login under pre-auth CSRF model)
  const csrfToken = req.csrfToken();

  // 1. Domain login (transactional, concurrency-safe)
  const result = await loginUserService(email, password);
  
  // 2. Normalize domain result into API response
  const response = transformLoginResponse(result);

  // 3. Persist refresh token in secure cookie (transport concern)
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 4. Send response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: response.accessToken,
      csrfToken,
      lastLogin: response.lastLogin,
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
 * @returns {Promise<void>}
 */
const refreshTokenController = wrapAsync(async (req, res) => {
  // Refresh tokens are stored in HTTP-only cookies
  const refreshToken = req.cookies?.refreshToken;
  
  // Service validates refresh token, rotates it, and issues a new access token
  const { accessToken, refreshToken: newRefreshToken } =
    await refreshTokenService(refreshToken);
  
  // Persist rotated refresh token (transport concern)
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  // Return new access token for subsequent authenticated requests
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
    },
  });
});

module.exports = {
  loginController,
  refreshTokenController,
};
