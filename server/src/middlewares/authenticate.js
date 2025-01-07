const { verifyToken, signToken } = require('../utils/token-helper');
const { logWarn, logError } = require('../utils/logger-helper');

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
        return res.status(401).json({ error: 'Access token is missing. Please log in.' });
      }
      
      try {
        // Verify the access token
        const user = verifyToken(accessToken);
        req.user = user; // Attach user details to the request
        return next();
      } catch (error) {
        // Handle expired access token with refresh token
        if (error.name === 'TokenExpiredError' && refreshToken) {
          logWarn('Access token expired. Attempting to refresh.');
          
          try {
            // Verify the refresh token
            const refreshPayload = verifyToken(refreshToken, true); // `true` indicates it's a refresh token
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
            logWarn('Invalid or expired refresh token.');
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
          }
        }
        
        // Handle invalid or other access token errors
        logWarn('Invalid access token.');
        return res.status(401).json({ error: 'Invalid or expired token.' });
      }
    } catch (error) {
      logError('Authentication middleware encountered an error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};

module.exports = authenticate;
