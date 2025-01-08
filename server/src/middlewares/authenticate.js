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
      const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
      const refreshToken = req.cookies?.refreshToken;
      
      if (!accessToken) {
        throw new AppError('Access token is missing. Please log in.', 401, {
          type: 'AuthenticationError',
          isExpected: true,
        });
      }
      
      try {
        // Verify the access token
        const user = verifyToken(accessToken);
        req.user = user; // Attach user details to the request
        return next();
      } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
          logWarn('Access token expired. Attempting to refresh with a valid refresh token.');
          
          try {
            // Verify the refresh token
            const refreshPayload = verifyToken(refreshToken, true); // `true` indicates it's a refresh token
            
            // Issue a new access token
            const newAccessToken = signToken({ id: refreshPayload.id, role_id: refreshPayload.role_id });
            
            // Set the new access token in the cookie
            res.cookie('accessToken', newAccessToken, {
              httpOnly: true,
              secure: true,
              maxAge: 15 * 60 * 1000, // 15 minutes
            });
            
            req.user = refreshPayload; // Attach refreshed user details
            return next();
          } catch (refreshError) {
            throw new AppError('Invalid or expired refresh token. Please log in again.', 401, {
              type: 'AuthenticationError',
              isExpected: true,
            });
          }
        }
        
        // Handle invalid or other access token errors
        throw new AppError('Invalid or expired access token.', 401, {
          type: 'AuthenticationError',
          isExpected: true,
        });
      }
    } catch (error) {
      logError('Authentication middleware encountered an error:', error);
      next(error); // Pass to the global error handler
    }
  };
};

module.exports = authenticate;
