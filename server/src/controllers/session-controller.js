const { loginUser } = require('../services/auth-service');
const { logError, logWarn } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { signToken, verifyToken } = require('../utils/token-helper');
const wrapAsync = require('../utils/wrap-async');

/**
 * Handles user login by validating credentials and issuing tokens.
 *
 * Workflow:
 * 1. Extracts email and password from the request body.
 * 2. Delegates business logic to the service layer (`loginUser`).
 * 3. If successful:
 *    - Issues access and refresh tokens.
 *    - Sets refresh token in secure HTTP-only cookies.
 *    - Returns a success response.
 * 4. If unsuccessful:
 *    - Returns appropriate error messages for invalid credentials or server errors.
 *
 * @param {object} req - Express request object.
 * @param {object} req.body - Request body containing email and password.
 * @param {string} req.body.email - User's email for login.
 * @param {string} req.body.password - User's password for login.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Sends HTTP response with success or error message.
 * @throws {Error} - Logs and handles unexpected server errors.
 */
const loginController = wrapAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const csrfToken = req.csrfToken();

  try {
    // Call the service layer for business logic
    const { accessToken, refreshToken, last_login } = await loginUser(
      email,
      password
    );

    // Set tokens in cookies
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return success response
    res.status(200).json({
      message: 'Login successful',
      accessToken,
      csrfToken,
      lastLogin: last_login || null,
    });
  } catch (error) {
    // Log unexpected errors
    if (!(error instanceof AppError)) {
      logError('Unexpected error during login:', error);
      return next(
        new AppError('Internal server error', 500, {
          type: 'UnexpectedError',
          isExpected: false,
        })
      );
    }

    // Log expected errors for debugging (if necessary)
    logError('Handled error during login:', error);

    // Return structured error response
    res.status(error.status).json(error.toJSON());
  }
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
