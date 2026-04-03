/**
 * @file auth-service.js
 * @description Business logic for authentication lifecycle operations.
 *
 * Exports:
 *   - logoutService          – revokes a single session for the authenticated user
 *   - changePasswordService  – validates, hashes, and persists a new password
 *                              with history enforcement and full session revocation
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers (repository, validators, business) are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { withTransaction } = require('../database/db');
const {
  getAndLockUserAuthByUserId,
  updatePasswordAndHistory,
} = require('../repositories/user-auth-repository');
const {
  hashPassword,
  verifyPassword,
} = require('../business/user-auth-business');
const { logSystemWarn } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { validatePasswordStrength }   = require('../security/password-policy');
const {
  logoutSession,
  revokeAllSessionsForUser,
} = require('../business/auth/session-lifecycle');

/** Maximum number of previous passwords retained for reuse enforcement. */
const PASSWORD_HISTORY_LIMIT = 5;

/**
 * Revokes a single session for the authenticated user.
 *
 * Exits early if either `userId` or `sessionId` is absent — nothing to revoke.
 *
 * @param {Object} session            - Active session identifiers.
 * @param {string} session.userId     - Authenticated user ID.
 * @param {string} session.sessionId  - Session token to revoke.
 * @param {Object} request            - Request metadata for audit context.
 * @param {string} request.ipAddress  - Client IP address.
 * @param {string} request.userAgent  - Client user-agent string.
 *
 * @returns {Promise<void>}
 *
 * @throws {AppError} Re-throws AppErrors from session lifecycle unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const logoutService = async (
  { userId, sessionId },
  { ipAddress, userAgent }
) => {
  // No active session — nothing to revoke.
  if (!userId || !sessionId) return;
  
  try {
    await logoutSession({ sessionId, ipAddress, userAgent });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to complete logout.', {
      meta: { error: error.message },
    });
  }
};

/**
 * Validates the current password, enforces reuse policy, hashes the new
 * password, persists it atomically, and revokes all active sessions.
 *
 * Steps:
 *   1. Fetch and lock the auth record for the user.
 *   2. Verify the current password against the stored hash.
 *   3. Validate new password strength against the password policy.
 *   4. Enforce password reuse policy against stored history.
 *   5. Hash the new password and build the updated history entry.
 *   6. Persist the new password hash and history atomically.
 *   7. Revoke all active sessions for the user (security boundary).
 *
 * @param {string} userId           - Authenticated user ID.
 * @param {string} currentPassword  - The user's current plaintext password.
 * @param {string} newPassword      - The desired new plaintext password.
 *
 * @returns {Promise<void>}
 *
 * @throws {AppError} `authenticationError`  – current password does not match.
 * @throws {AppError} `validationError`      – new password fails strength or reuse check.
 * @throws {AppError} `notFoundError`        – auth record missing after lock.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const changePasswordService = async (userId, currentPassword, newPassword) => {
  const context = 'auth-service/changePasswordService';
  
  return withTransaction(async (client) => {
    try {
      // 1. Fetch & lock auth record (single source of truth).
      const auth = await getAndLockUserAuthByUserId(userId, client);
      
      const { auth_id: authId, password_hash, metadata } = auth;
      
      // 2. Verify current password.
      const isValid = await verifyPassword(password_hash, currentPassword);
      
      if (!isValid) {
        // Warn on deliberate invalid-credential attempts — notable but expected.
        logSystemWarn('Password change rejected: current password mismatch', {
          context,
          userId,
        });
        
        throw AppError.authenticationError('Invalid credentials.');
      }
      
      // 3. Validate new password strength.
      validatePasswordStrength(newPassword);
      
      // 4. Enforce password reuse policy.
      const passwordHistory = metadata?.password_history ?? [];
      
      for (const entry of passwordHistory) {
        const reused = await verifyPassword(entry.password_hash, newPassword);
        
        if (reused) {
          throw AppError.validationError(
            'New password cannot match a previously used password.'
          );
        }
      }
      
      // 5. Hash new password and build updated history entry.
      const newPasswordHash = await hashPassword(newPassword);
      
      const updatedHistory = [
        { password_hash: newPasswordHash, changed_at: new Date().toISOString() },
        ...passwordHistory,
      ].slice(0, PASSWORD_HISTORY_LIMIT);
      
      // 6. Persist password + history atomically.
      const result = await updatePasswordAndHistory(
        authId,
        newPasswordHash,
        updatedHistory,
        client
      );
      
      if (!result) {
        throw AppError.notFoundError('Authentication record not found.');
      }
      
      // 7. Revoke all active sessions (security boundary — new password invalidates all tokens).
      await revokeAllSessionsForUser(userId, client);
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw AppError.serviceError('Unable to complete password change.', {
        meta: { error: error.message },
      });
    }
  });
};

module.exports = {
  logoutService,
  changePasswordService,
};
