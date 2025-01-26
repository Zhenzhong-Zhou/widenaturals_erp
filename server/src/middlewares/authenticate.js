const { verifyToken, signToken } = require('../utils/token-helper');
const { logWarn, logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { validateUserExists, validateRoleById } = require('../validators/db-validators');

/**
 * Middleware to authenticate users using JWT tokens.
 * Automatically refreshes access tokens if expired and a valid refresh token is provided.
 *
 * @returns {function} - Middleware function for authentication.
 */
const authenticate = () => {
  return async (req, res, next) => {
    try {
      // Access token should come from the Authorization header
      const accessToken = req.headers.authorization?.split(' ')[1];
      const refreshToken = req.cookies?.refreshToken; // Refresh token remains in the cookies

      if (!accessToken) {
        logWarn('Access token is missing. Please log in.', {
          ip: req.ip || 'N/A',
          route: req.originalUrl || 'N/A',
          userAgent: req.headers['user-agent'] || 'N/A',
        });
        return next(
          AppError.accessTokenError('Access token is missing. Please log in.')
        );
      }

      try {
        // Verify the access token
        const user = verifyToken(accessToken); // Throws if the token is invalid or expired

        // Validate if the user exists in the database
        await validateUserExists('id', user.id);
        
        // Validate the role ID and get the validated value
        const validatedRoleId= await validateRoleById(user.role);
        
        req.user = {
          ...user, // Attach validated user to the request
          role: validatedRoleId,
        };
        return next();
      } catch (error) {
        // If the access token is expired and a refresh token is available
        if (error.name === 'TokenExpiredError' && refreshToken) {
          logWarn(
            'Access token expired. Attempting to refresh with a valid refresh token.',
            {
              ip: req.ip || 'N/A',
              route: req.originalUrl || 'N/A',
              userAgent: req.headers['user-agent'] || 'N/A',
            }
          );

          try {
            // Verify the refresh token
            const refreshPayload = verifyToken(refreshToken, true); // `true` indicates it's a refresh token

            // Issue a new access token
            const newAccessToken = signToken({
              id: refreshPayload.id,
              role: refreshPayload.role,
            });

            // Send the new access token to the client in the response body
            res.setHeader('X-New-Access-Token', newAccessToken);

            req.user = refreshPayload; // Attach refreshed user details
            return next();
          } catch (refreshError) {
            logError('Invalid or expired refresh token encountered.', {
              ip: req.ip || 'N/A',
              route: req.originalUrl || 'N/A',
              error: refreshError.message,
            });

            // Handle refresh token expiration or invalidation
            if (refreshError.name === 'TokenExpiredError') {
              throw AppError.refreshTokenExpiredError(
                'Refresh token expired. Please log in again.'
              );
            } else {
              throw AppError.refreshTokenError(
                'Invalid refresh token. Please log in again.'
              );
            }
          }
        }

        // Handle other access token errors
        logError('Invalid or expired access token encountered.', {
          ip: req.ip || 'N/A',
          route: req.originalUrl || 'N/A',
          error: error.message,
        });
        throw AppError.accessTokenExpiredError(
          'Access token expired. Please use your refresh token.'
        );
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
