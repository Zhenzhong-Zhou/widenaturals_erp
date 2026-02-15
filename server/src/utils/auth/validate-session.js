const AppError = require('../../utils/AppError');
const { getSessionById } = require('../../repositories/session-repository');

/**
 * Validates session state.
 *
 * Guarantees:
 * - Session exists
 * - Session is not revoked
 * - Session is not expired
 *
 * @param {string} sessionId
 * @param {Object|null} client
 *
 * @returns {Promise<{
 *   id: string,
 *   user_id: string,
 *   expires_at: Date,
 *   revoked_at: Date | null,
 *   logout_at: Date | null
 * }>}
 */
const validateSessionState = async (sessionId, client = null) => {
  if (!sessionId) {
    throw AppError.authenticationError('Session is missing.');
  }

  const session = await getSessionById(sessionId, client);

  if (!session) {
    throw AppError.authenticationError('Session no longer exists.');
  }

  if (session.revoked_at) {
    throw AppError.authenticationError('Session has been revoked.');
  }

  if (session.logout_at) {
    throw AppError.authenticationError('Session has been logged out.');
  }

  if (session.expires_at <= new Date()) {
    throw AppError.authenticationError('Session expired.');
  }

  return session;
};

module.exports = {
  validateSessionState,
};
