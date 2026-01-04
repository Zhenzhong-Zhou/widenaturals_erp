const wrapAsync = require('../utils/wrap-async');
const { loginUserService } = require('../services/session-service');
const { transformLoginResponse } = require('../transformers/session-transformer');
const { logError, logWarn } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { signToken, verifyToken } = require('../utils/token-helper');

/**
 * Handles user authentication and session initialization.
 *
 * This controller implements the HTTP boundary for user login.
 * It validates request input, enforces the pre-authentication CSRF model,
 * delegates credential verification and transactional state updates to
 * the service layer, and constructs the final API response.
 *
 * Security model:
 * - Login requests are protected by CSRF middleware (pre-auth CSRF).
 * - A valid CSRF token MUST be present before authentication is attempted.
 * - Refresh tokens are issued and stored in secure, HTTP-only cookies.
 *
 * Workflow:
 * 1. Extract credentials from the request body.
 * 2. Generate / validate the CSRF token (required before login).
 * 3. Invoke the authentication service to:
 *    - Verify credentials
 *    - Enforce lockout rules
 *    - Update login metadata
 *    - Issue access and refresh tokens
 * 4. Normalize the domain result into a stable API response.
 * 5. Persist the refresh token in a secure cookie.
 * 6. Return a successful authentication response.
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
  
  // CSRF token MUST exist before login (pre-auth CSRF model)
  const csrfToken = req.csrfToken();

  // 1. Domain login (transactional, concurrency-safe)
  const result = await loginUserService(email, password);
  
  // 2. Normalize domain result into API response
  const response = transformLoginResponse(result);
  
  // 3. Set refresh token cookie (transport concern)
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 4. Send response
  res.status(200).json({
    message: 'Login successful',
    accessToken: response.accessToken,
    csrfToken,
    lastLogin: response.lastLogin,
  });
});

/**
 * Controller to handle token refresh requests.
 * Verifies the refresh token and generates a new access token.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param next
 */
const refreshTokenController = wrapAsync(async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // Check if the refresh token exists
    if (!refreshToken) {
      logWarn('Refresh token is missing. User needs to log in again.', {
        route: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || 'Unknown',
      });
      return next(
        AppError.refreshTokenError(
          'Refresh token is required. Please log in again.',
          {
            logLevel: 'warn',
          }
        )
      );
    }

    try {
      // Verify the refresh token
      const payload = verifyToken(refreshToken, true); // `true` indicates this is a refresh token

      // Rotate the refresh token
      const newRefreshToken = signToken(
        { id: payload.id, role: payload.role },
        true
      ); // Pass `true` for refresh token

      // Generate a new access token
      const newAccessToken = signToken({
        id: payload.id,
        role: payload.role,
      });

      // Set the new refresh token in a secure cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return the access token in the response body
      return res.status(200).json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      if (error.name === 'RefreshTokenExpiredError') {
        // Refresh token expired
        return next(
          AppError.refreshTokenExpiredError(
            'Refresh token expired. Please log in again.'
          )
        );
      } else if (error.name === 'JsonWebTokenError') {
        // Invalid refresh token
        return next(
          AppError.tokenRevokedError(
            'Invalid refresh token. Please log in again.'
          )
        );
      } else {
        // Unexpected token-related error
        logError('Unexpected error during token verification:', {
          error: error.message,
        });
        return next(
          AppError.generalError(
            'Unexpected error occurred while refreshing token.',
            { logLevel: 'error' }
          )
        );
      }
    }
  } catch (error) {
    logError('Error refreshing token:', error);
    return next(error); // Pass any unexpected errors to the global error handler
  }
});

module.exports = { loginController, refreshTokenController };
