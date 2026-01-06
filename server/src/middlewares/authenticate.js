const { verifyToken } = require('../utils/token-helper');
const {
  logSystemWarn,
  logSystemException,
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const {
  userExistsByField,
} = require('../repositories/user-repository');

/**
 * Middleware to authenticate requests using an access token.
 *
 * Responsibilities:
 * - Verify access token
 * - Ensure referenced user still exists
 * - Attach user payload to request
 *
 * Explicitly does NOT:
 * - Refresh tokens
 * - Retry requests
 * - Mutate session state
 *
 * Session recovery is handled by the client via /session/refresh.
 */
const authenticate = () => {
  return async (req, res, next) => {
    try {
      const accessToken = req.headers.authorization?.split(' ')[1];
      
      if (!accessToken) {
        logSystemWarn('Access token missing', { path: req.path });
        return next(
          AppError.accessTokenError(
            'Access token is missing. Please log in.'
          )
        );
      }
      
      // ------------------------------------------------------------
      // Verify access token
      // ------------------------------------------------------------
      const payload = verifyToken(accessToken);
      
      // ------------------------------------------------------------
      // Structural existence check (no status semantics)
      // ------------------------------------------------------------
      const exists = await userExistsByField('id', payload.id);
      
      if (!exists) {
        throw AppError.authenticationError(
          'User associated with this token no longer exists.'
        );
      }
      
      req.user = payload;
      return next();
    } catch (error) {
      logSystemException(error, 'Authentication failed');
      
      return next(
        error instanceof AppError
          ? error
          : AppError.authenticationError(
            error.message || 'Authentication failed.'
          )
      );
    }
  };
};

module.exports = authenticate;
