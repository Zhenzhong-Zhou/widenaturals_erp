/**
 * @file validate-session.js
 * @description Database-level session state validation.
 *
 * Design intent:
 *  - Enforces session validity independently of JWT verification — a valid JWT
 *    is not sufficient if the session has been revoked, logged out, or expired.
 *  - Fails closed on any invalid state — revoked, logged out, and expired sessions
 *    all result in authenticationError.
 *  - Security-relevant rejections (revoked, expired) are logged as warnings for
 *    audit visibility before throwing.
 *
 * Depends on:
 *  - getSessionById (session-repository.js) — session persistence lookup
 *  - AppError                               — structured domain error creation
 *  - logSystemWarn  (system-logger.js)      — security event logging
 */

const AppError = require('../../utils/AppError');
const { getSessionById } = require('../../repositories/session-repository');
const { logSystemWarn } = require('../logging/system-logger');

/**
 * Validates session existence, revocation, logout, and expiry state.
 *
 * Validation steps (in order):
 *  1. sessionId must be present
 *  2. Session must exist in the database
 *  3. Session must not be revoked (revoked_at is null)
 *  4. Session must not be logged out (logout_at is null)
 *  5. Session must not be expired (expires_at > now)
 *
 * NOTE:
 *  - This function does not verify JWT signatures — cryptographic validation
 *    must be performed upstream before calling this.
 *  - Revoked and expired sessions are logged as warnings before throwing
 *    since these are security-relevant events.
 *
 * @param {string}      sessionId      - Session ID from the JWT payload.
 * @param {Object|null} [client=null]  - Optional transaction client.
 *
 * @returns {Promise<{
 *   id:         string,
 *   user_id:    string,
 *   expires_at: Date,
 *   revoked_at: Date | null,
 *   logout_at:  Date | null
 * }>} Validated session record.
 *
 * @throws {AppError} authenticationError — If session is missing, invalid, revoked, logged out, or expired.
 */
const validateSessionState = async (sessionId, client = null) => {
  const context = 'validate-session/validateSessionState';

  if (!sessionId) {
    throw AppError.authenticationError('Session is missing.');
  }

  const session = await getSessionById(sessionId, client);

  if (!session) {
    // Deliberately vague — do not reveal whether session ever existed
    throw AppError.authenticationError('Session no longer exists.');
  }

  if (session.revoked_at) {
    // Security-relevant — a revoked session being presented may indicate token reuse
    logSystemWarn('Revoked session presented', {
      context,
      sessionId,
      userId: session.user_id,
      revokedAt: session.revoked_at,
    });

    throw AppError.authenticationError('Session has been revoked.');
  }

  if (session.logout_at) {
    logSystemWarn('Logged-out session presented', {
      context,
      sessionId,
      userId: session.user_id,
      logoutAt: session.logout_at,
    });

    throw AppError.authenticationError('Session has been logged out.');
  }

  if (session.expires_at <= new Date()) {
    logSystemWarn('Expired session presented', {
      context,
      sessionId,
      userId: session.user_id,
      expiresAt: session.expires_at,
    });

    throw AppError.authenticationError('Session expired.');
  }

  return session;
};

module.exports = {
  validateSessionState,
};
