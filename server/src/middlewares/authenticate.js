/**
 * @file authenticate.js
 * @description Express middleware factory that enforces authentication on
 * protected routes by validating the access token and session state.
 */

'use strict';

const AppError = require('../utils/AppError');
const { getAccessTokenFromHeader } = require('../utils/auth-header-utils');
const { validateAccessToken } = require('../utils/auth/validate-token');
const { userExistsByField } = require('../repositories/user-repository');
const { updateSessionLastActivityAt } = require('../repositories/session-repository');
const { logWarn } = require('../utils/logging/logger-helper');

const CONTEXT = 'middleware/authenticate';

/**
 * Express middleware factory that enforces authentication on protected routes.
 *
 * Guarantees (on success):
 *   - Access token (JWT) is cryptographically valid
 *   - Token persistence state is valid (not revoked, not expired)
 *   - Associated session is active and not revoked
 *   - Referenced user still exists in the database
 *   - Immutable auth context is attached as `req.auth` for downstream use
 *
 * Explicitly does NOT:
 *   - Refresh or rotate tokens
 *   - Create or destroy sessions
 *   - Perform authorization checks (role/permission checks are separate)
 *
 * Security properties:
 *   - Fails closed on any validation error
 *   - Does not expose internal token or session identifiers in responses
 *   - Unknown errors are wrapped as generic auth errors to prevent info leakage
 *
 * @returns {import('express').RequestHandler}
 */
const authenticate = () => {
  /**
   * @param {import('express').Request & { auth?: AuthContext }} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  return async (req, res, next) => {
    try {
      const accessToken = getAccessTokenFromHeader(req);
      
      if (!accessToken) {
        throw AppError.accessTokenError('Access token is missing.');
      }
      
      // ------------------------------------------------------------------
      // 1. Validate access token (JWT signature, expiry, session state)
      // ------------------------------------------------------------------
      const payload = await validateAccessToken(accessToken);
      
      // ------------------------------------------------------------------
      // 2. Structural user existence check
      // Ensures the user account still exists — it may have been deleted
      // after the token was issued.
      // ------------------------------------------------------------------
      const userExists = await userExistsByField('id', payload.id);
      
      if (!userExists) {
        throw AppError.authenticationError(
          'User associated with this token no longer exists.'
        );
      }
      
      // ------------------------------------------------------------------
      // 3. Update session activity (best-effort, non-blocking)
      // A failure here means the activity timestamp is stale, which is
      // acceptable. It must not fail the request or expose an error to
      // the client.
      // ------------------------------------------------------------------
      try {
        await updateSessionLastActivityAt(payload.sessionId);
      } catch (activityError) {
        logWarn('Failed to update session last activity', {
          context: CONTEXT,
          sessionId: payload.sessionId,
          message: activityError.message,
        });
      }
      
      // ------------------------------------------------------------------
      // 4. Attach auth context for downstream middleware and route handlers
      // ------------------------------------------------------------------
      
      req.auth = {
        user: {
          id:   payload.id,
          role: payload.role,
        },
        sessionId: payload.sessionId,
      };
      
      next();
      
    } catch (error) {
      // Pass known AppErrors through unchanged — they already carry the
      // correct type, code, and status. Wrap anything else as a generic
      // auth error to avoid leaking internal error details to the client.
      const authError =
        error instanceof AppError
          ? error
          : AppError.authenticationError('Authentication failed.');
      
      next(authError);
    }
  };
};

module.exports = authenticate;
