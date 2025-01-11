const { verifyToken, signToken } = require('../utils/token-helper');
const { logWarn, logError } = require('../utils/logger-helper');
const AppError = require('../utils/app-error');

/**
 * Middleware to authenticate users using JWT tokens.
 * Automatically refreshes access tokens if expired and a valid refresh token is provided.
 *
 * @returns {function} - Middleware function for authentication.
 */
const authenticate = () => {
  return async (req, res, next) => {
    try {
      const accessToken =
        req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
      const refreshToken = req.cookies?.refreshToken;

      if (!accessToken) {
        throw AppError.authenticationError(
          'Access token is missing. Please log in.'
        );
      }

      try {
        // Verify the access token
        const user = verifyToken(accessToken);
        req.user = user; // Attach user details to the request
        return next();
      } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
          logWarn(
            'Access token expired. Attempting to refresh with a valid refresh token.',
            {
              ip: req.ip || 'N/A',
              route: req.originalUrl || 'N/A',
            }
          );

          try {
            // Verify the refresh token
            const refreshPayload = verifyToken(refreshToken, true); // `true` indicates it's a refresh token

            // Issue a new access token
            const newAccessToken = signToken({
              id: refreshPayload.id,
              role_id: refreshPayload.role_id,
            });

            // Set the new access token in the cookie
            res.cookie('accessToken', newAccessToken, {
              httpOnly: true,
              secure: true,
              maxAge: 15 * 60 * 1000, // 15 minutes
            });

            req.user = refreshPayload; // Attach refreshed user details
            return next();
          } catch (refreshError) {
            logError('Invalid or expired refresh token encountered.', {
              ip: req.ip || 'N/A',
              route: req.originalUrl || 'N/A',
              error: refreshError.message,
            });
            throw AppError.authenticationError(
              'Invalid or expired refresh token. Please log in again.'
            );
          }
        }

        // Handle invalid or other access token errors
        logError('Invalid or expired access token encountered.', {
          ip: req.ip || 'N/A',
          route: req.originalUrl || 'N/A',
          error: error.message,
        });
        throw AppError.authenticationError('Invalid or expired access token.');
      }
    } catch (error) {
      logError('Authentication middleware encountered an error:', {
        ip: req.ip || 'N/A',
        method: req.method || 'N/A',
        url: req.originalUrl || 'N/A',
        userAgent: req.headers['user-agent'] || 'N/A',
        timestamp: new Date().toISOString(),
        error: error.message,
      });

      if (!(error instanceof AppError)) {
        error = AppError.authenticationError(
          error.message || 'Authentication failed.'
        );
      }

      return next(error); // Pass to the global error handler
    }
  };
};

module.exports = authenticate;
