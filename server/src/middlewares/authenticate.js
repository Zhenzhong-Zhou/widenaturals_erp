const AppError = require('../utils/AppError');
const { getAccessTokenFromHeader } = require('../utils/auth-header-utils');
const { validateAccessToken } = require('../utils/auth/validate-token');
const { userExistsByField } = require('../repositories/user-repository');
const { updateSessionLastActivityAt } = require('../repositories/session-repository');
const { logSystemException } = require('../utils/system-logger');

/**
 * Authentication middleware for protected routes.
 *
 * Guarantees (on success):
 * - Access token (JWT) is cryptographically valid
 * - Token persistence state is valid (not revoked / not expired)
 * - Associated session is active and not revoked
 * - Referenced user still exists
 * - Immutable authentication context is attached as `req.auth`
 *
 * Responsibilities:
 * - Extract and validate access token from request
 * - Enforce token + session lifecycle invariants
 * - Perform structural user existence check
 * - Update session last-activity timestamp (best-effort)
 *
 * Explicitly does NOT:
 * - Refresh tokens
 * - Rotate or revoke tokens
 * - Create or destroy sessions
 * - Perform authorization checks (handled separately)
 *
 * Security properties:
 * - Fails closed on any validation error
 * - Does not expose internal token or session identifiers
 * - Normalizes unexpected errors into authentication errors
 *
 * Operational notes:
 * - Session activity updates are intended to be non-blocking
 * - Token refresh is handled exclusively by `/auth/refresh`
 *
 * @returns {import('express').RequestHandler}
 */
const authenticate = () => {
  return async (req, res, next) => {
    try {
      const accessToken = getAccessTokenFromHeader(req);
      
      if (!accessToken) {
        throw AppError.accessTokenError('Access token is missing.');
      }
      
      // ------------------------------------------------------------
      // 1. Validate access token (JWT + session)
      // ------------------------------------------------------------
      const payload = await validateAccessToken(accessToken);
      
      // ------------------------------------------------------------
      // 2. Structural user existence check
      // ------------------------------------------------------------
      const userExists = await userExistsByField('id', payload.id);
      if (!userExists) {
        throw AppError.authenticationError(
          'User associated with this token no longer exists.'
        );
      }
      
      // ------------------------------------------------------------
      // 3. Update session activity
      // ------------------------------------------------------------
      await updateSessionLastActivityAt(payload.sessionId);
      
      // ------------------------------------------------------------
      // 4. Attach auth context
      // ------------------------------------------------------------
      req.auth = {
        user: {
          id: payload.id,
          role: payload.role,
        },
        sessionId: payload.sessionId,
      };
      
      return next();
    } catch (error) {
      logSystemException(error, 'Authentication failed');
      
      return next(
        error instanceof AppError
          ? error
          : AppError.authenticationError('Authentication failed.')
      );
    }
  };
};

module.exports = authenticate;
