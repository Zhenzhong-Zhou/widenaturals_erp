const { verifyToken } = require('../utils/auth/jwt-utils');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { userExistsByField } = require('../repositories/user-repository');
const { validateAccessTokenState } = require('../utils/auth/validate-token');
const { validateSessionState } = require('../utils/auth/validate-session');
const { updateSessionLastActivityAt } = require('../repositories/session-repository');

/**
 * Authentication middleware for protected routes.
 *
 * Responsibilities:
 * - Extract and verify access token (JWT)
 * - Validate token persistence state (revoked / expired)
 * - Validate associated session state
 * - Ensure referenced user still exists
 * - Update session last-activity timestamp
 * - Attach immutable authentication context to the request
 *
 * Explicitly does NOT:
 * - Refresh tokens
 * - Rotate or revoke tokens
 * - Create or destroy sessions
 *
 * Token refresh is handled exclusively by `/auth/refresh`.
 *
 * Notes:
 * - Session activity updates are lightweight and non-failing
 * - Failure to update activity MUST NOT block request execution
 * - Authentication context is attached as `req.auth`
 *
 * @returns {import('express').RequestHandler}
 */
const authenticate = () => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
      
      if (!accessToken) {
        return next(
          AppError.accessTokenError('Access token is missing.')
        );
      }
      
      // ------------------------------------------------------------
      // 1. Verify JWT cryptographically (signature + exp)
      // ------------------------------------------------------------
      const payload = verifyToken(accessToken);
      
      // ------------------------------------------------------------
      // 2. Validate token persistence state
      // ------------------------------------------------------------
      const token = await validateAccessTokenState(accessToken);
      
      // ------------------------------------------------------------
      // 3. Validate session state
      // ------------------------------------------------------------
      const session = await validateSessionState(token.session_id);
      
      // ------------------------------------------------------------
      // 4. Structural user existence check (no status semantics)
      // ------------------------------------------------------------
      const userExists = await userExistsByField('id', payload.id);
      if (!userExists) {
        throw AppError.authenticationError(
          'User associated with this token no longer exists.'
        );
      }
      
      // Update session activity (best-effort, non-blocking)
      await updateSessionLastActivityAt(session.id);
      
      // ------------------------------------------------------------
      // 5. Attach immutable auth context
      // ------------------------------------------------------------
      req.auth = {
        user: payload,
        sessionId: session.id,
        tokenId: token.id,
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
