const { verifyToken, signToken } = require('../utils/token-helper');
const { logWarn, logError } = require('../utils/logger-helper');

/**
 * Middleware to authenticate users using JWT tokens.
 * Automatically refreshes access tokens if expired and a valid refresh token is provided.
 *
 * @returns {function} - Middleware function for authentication.
 */
const authenticate = (optional = false) => {
  return async (req, res, next) => {
    // Skip authentication in development or testing mode
    if (process.env.AUTH_ENABLED === 'false') {
      req.user = { id: 'test-user', role: 'admin' }; // Mock user for testing
      return next();
    }
    
    // Allow access to optional or explicitly marked public routes
    if (optional || req.isPublic) {
      req.user = null;
      return next();
    }
    
    try {
      const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
      const refreshToken = req.cookies?.refreshToken;
      
      if (!accessToken) {
        return res.status(401).json({ error: 'Access token is missing. Please log in.' });
      }
      
      try {
        // Verify access token
        const user = verifyToken(accessToken);
        req.user = user; // Attach the user object to the request
        return next();
      } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
          logWarn('Access token expired. Attempting to refresh.');
          try {
            // Verify the refresh token
            const refreshPayload = verifyToken(refreshToken, true); // `true` indicates it's a refresh token
            const newAccessToken = signToken({ id: refreshPayload.id, role: refreshPayload.role });
            
            // Set the new access token in cookies or headers
            res.cookie('accessToken', newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 15 * 60 * 1000, // 15 minutes
            });
            
            req.user = refreshPayload; // Attach the refreshed user to the request
            return next();
          } catch (refreshError) {
            logWarn('Refresh token is invalid or expired.');
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
          }
        }
        
        logWarn('Invalid access token.');
        return res.status(401).json({ error: 'Invalid or expired token.' });
      }
    } catch (error) {
      logError('Authentication error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};

module.exports = authenticate;
