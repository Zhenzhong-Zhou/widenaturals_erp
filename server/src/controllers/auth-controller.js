/**
 * @file auth-controller.js
 * @description Contains the logic for authentication routes.
 */

/**
 * POST /login
 * Handles user login.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const { signToken, verifyToken } = require('../utils/token-helper');
const { logError, logWarn, logInfo } = require('../utils/logger-helper');
const { authenticationError, tokenRevokedError, refreshTokenError, accessTokenExpiredError, refreshTokenExpiredError,
  generalError
} = require('../utils/AppError');

/**
 * Handles user logout by clearing authentication cookies and invalidating tokens.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param next
 */
const logoutController = (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Log user details for auditing in non-production environments
    if (!isProduction && req.user) {
      logInfo(`User ${req.user.id} logged out at ${new Date().toISOString()}`);
    }
    
    // Optional: Check if refreshToken exists in the cookies before proceeding
    if (!req.cookies.refreshToken) {
      return next(
        authenticationError('No active session found', {
          isExpected: true,
        })
      );
    }
    
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
    });
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error); // Delegate error handling to your centralized error handler
  }
};

/**
 * Controller to handle token refresh requests.
 * Verifies the refresh token and generates a new access token.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param next
 */
const refreshTokenController = async (req, res, next) => {
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
        refreshTokenError('Refresh token is required. Please log in again.', {
          logLevel: 'warn',
        })
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
          refreshTokenExpiredError(
            'Refresh token expired. Please log in again.'
          )
        );
      } else if (error.name === 'JsonWebTokenError') {
        // Invalid refresh token
        return next(
          tokenRevokedError(
            'Invalid refresh token. Please log in again.'
          )
        );
      } else {
        // Unexpected token-related error
        logError('Unexpected error during token verification:', {
          error: error.message,
        });
        return next(
          generalError(
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
};

// todo /auth/reset-password
// todo /auth/forgot-password

module.exports = { logoutController, refreshTokenController };
