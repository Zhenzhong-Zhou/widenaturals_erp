/**
 * @file auth-service.js
 * @description Service layer for authentication lifecycle operations.
 *
 * Exports:
 *   - loginUserService       – authenticates a user and issues session tokens
 *   - refreshTokenService    – rotates a refresh token and issues new tokens
 *   - logoutService          – revokes a single session for the authenticated user
 *   - changePasswordService  – validates, hashes, and persists a new password
 *                              with history enforcement and full session revocation
 *
 * Internal helpers (not exported, pending move to session-service.js):
 *   - logoutSession  – transaction-scoped session logout and audit
 *
 * Error handling follows a single-log principle — errors are not logged here
 * except where noted below.
 *
 * Special cases:
 *   - Missing password hash is logged with `logSystemException` before throwing —
 *     it indicates a data integrity issue that warrants an internal alert.
 *   - Post-commit audit logging failure is caught and logged with `logSystemWarn` —
 *     it must never fail the login response.
 *   - Password mismatch on change is logged with `logSystemWarn` —
 *     it is a notable but expected security event.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { withTransaction }                          = require('../database/db');
const { getStatusId }                              = require('../config/status-cache');
const AppError                                     = require('../utils/AppError');
const {
  getAndLockUserAuthByEmail,
  getAndLockUserAuthByUserId,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
  updatePasswordAndHistory,
}                                                  = require('../repositories/user-auth-repository');
const {
  hashPassword,
  verifyPassword,
}                                                  = require('../utils/password-utils');
const {
  logSystemInfo,
  logSystemWarn,
  logSystemException,
}                                                  = require('../utils/logging/system-logger');
const { signToken, verifyRefreshJwt }              = require('../utils/auth/jwt-utils');
const { transformLoginResponse }                   = require('../transformers/session-transformer');
const { insertLoginHistory }                       = require('../repositories/login-history-repository');
const { insertTokenActivityLog }                   = require('../repositories/token-activity-log-repository');
const { validateRefreshTokenState }                = require('../utils/auth/validate-token');
const { validateSessionState }                     = require('../utils/auth/validate-session');
const {
  revokeTokenById,
  insertToken,
  revokeAllTokensBySessionId,
}                                                  = require('../repositories/token-repository');
const { hashToken }                                = require('../utils/auth/token-hash');
const { getTokenExpiry }                           = require('../utils/auth/token-expiry');
const { getAuthUserById }                          = require('../repositories/user-repository');
const { logoutSessionRowById }                     = require('../repositories/session-repository');
const { validatePasswordStrength }                 = require('../security/password-policy');
const {
  issueSessionWithTokens,
  revokeAllSessionsForUser,
}                                                  = require('./session-service');

const CONTEXT = 'auth-service';

/** Maximum number of previous passwords retained for reuse enforcement. */
const PASSWORD_HISTORY_LIMIT = 5;

// ---------------------------------------------------------------------------
// Internal helper (pending move to session-service.js)
// ---------------------------------------------------------------------------

/**
 * Marks a session as logged out, revokes its tokens, and records audit events.
 * Returns `null` if the session was already logged out or not found (idempotent).
 *
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string | null} params.ipAddress
 * @param {string | null} params.userAgent
 * @param {import('pg').PoolClient} client - Active transaction client.
 * @returns {Promise<{ sessionId: string, revokedTokenCount: number } | null>}
 */
const logoutSession = async ({ sessionId, ipAddress, userAgent }, client) => {
  const context = `${CONTEXT}/logoutSession`;
  
  // 1. Mark session as logged out (idempotent).
  const session = await logoutSessionRowById(sessionId, client);
  
  if (!session) {
    // Already logged out or not found — nothing to do.
    return null;
  }
  
  // 2. Revoke all active tokens linked to this session.
  const revokedTokens = await revokeAllTokensBySessionId(sessionId, client);
  
  // 3. Record explicit logout event.
  await insertLoginHistory(
    {
      userId: session.user_id,
      sessionId,
      tokenId: null,
      authActionTypeId: getStatusId('logout'),
      status: 'success',
      ipAddress,
      userAgent,
    },
    client
  );
  
  // 4. Record token-level revocation events.
  await Promise.all(
    revokedTokens.map((token) =>
      insertTokenActivityLog(
        {
          userId: token.user_id,
          tokenId: token.id,
          eventType: 'revoke',
          status: 'success',
          tokenType: token.token_type,
          ipAddress,
          userAgent,
        },
        client
      )
    )
  );
  
  logSystemInfo('Session logged out successfully', {
    context,
    sessionId,
    revokedTokenCount: revokedTokens.length,
  });
  
  return {
    sessionId,
    revokedTokenCount: revokedTokens.length,
  };
};

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

/**
 * Authenticates a user by email and password, issues a session with tokens,
 * and records login history.
 *
 * Enforces single-session policy — all existing sessions are revoked on
 * successful login. Login history is recorded for both successful and failed
 * attempts. Post-commit audit logging is best-effort and will not fail the
 * login response if it errors.
 *
 * @param {string} email
 * @param {string} password
 * @param {object} [options={}]
 * @param {string | null} [options.ipAddress=null]
 * @param {string | null} [options.userAgent=null]
 * @param {string | null} [options.deviceId=null]
 * @param {object | null} [options.parsedUserAgent=null]
 * @returns {Promise<object>} Transformed login response with access and refresh tokens.
 * @throws {AppError} authenticationError – invalid credentials or missing password hash.
 * @throws {AppError} accountLockedError – account is currently locked.
 * @throws {AppError} validationError – active status ID not available.
 * @throws {AppError} generalError – login succeeded but token issuance failed.
 */
const loginUserService = async (
  email,
  password,
  { ipAddress = null, userAgent = null, deviceId = null, parsedUserAgent = null } = {}
) => {
  const context = `${CONTEXT}/loginUserService`;
  
  let issued; // captured for post-commit audit log
  let userId; // captured for post-commit audit log
  
  const response = await withTransaction(async (client) => {
    const activeStatusId = getStatusId('general_active');
    
    if (!activeStatusId) {
      throw AppError.validationError('Active status ID is required.');
    }
    
    // 1. Fetch and lock auth record by email.
    const auth = await getAndLockUserAuthByEmail(email, activeStatusId, client);
    
    if (!auth) {
      await insertLoginHistory(
        {
          userId: null,
          sessionId: null,
          tokenId: null,
          authActionTypeId: getStatusId('Invalid Credentials'),
          status: 'failure',
          ipAddress,
          userAgent,
        },
        client
      );
      
      // Do not reveal whether the email exists or the account is inactive.
      throw AppError.authenticationError('Invalid email or password.');
    }
    
    const {
      user_id,
      auth_id,
      role_id,
      password_hash,
      last_login,
      attempts,
      failed_attempts,
      lockout_time,
    } = auth;
    
    userId = user_id;
    
    // 2. Lockout check — reject before password verification.
    if (lockout_time && lockout_time > new Date()) {
      await insertLoginHistory(
        {
          userId: user_id,
          sessionId: null,
          tokenId: null,
          authActionTypeId: getStatusId('Account Locked'),
          status: 'failure',
          ipAddress,
          userAgent,
        },
        client
      );
      
      throw AppError.accountLockedError('Account locked. Try again later.', {
        lockoutEndsAt: lockout_time,
      });
    }
    
    // 3. Guard against missing password hash — data integrity issue, log internally.
    if (!password_hash) {
      // logSystemException used here — missing hash indicates a data integrity
      // problem that warrants an internal alert, not just a client error.
      logSystemException(
        new Error('Missing password hash during login'),
        'Auth record has no password hash',
        { context, userId: user_id, authId: auth_id }
      );
      
      // Do not expose internal state to the client.
      throw AppError.authenticationError('Invalid email or password.');
    }
    
    // 4. Verify password and track attempts.
    const isValidPassword = await verifyPassword(password_hash, password);
    const newTotalAttempts = attempts + 1;
    
    if (!isValidPassword) {
      await incrementFailedAttempts(auth_id, newTotalAttempts, failed_attempts, client);
      
      await insertLoginHistory(
        {
          userId: user_id,
          sessionId: null,
          tokenId: null,
          authActionTypeId: getStatusId('Invalid Credentials'),
          status: 'failure',
          ipAddress,
          userAgent,
        },
        client
      );
      
      throw AppError.authenticationError('Invalid email or password.');
    }
    
    // 5. Successful login — reset failed attempts and update last login.
    await resetFailedAttemptsAndUpdateLastLogin(auth_id, newTotalAttempts, client);
    
    // Enforce single-session policy — revoke all existing sessions and tokens.
    await revokeAllSessionsForUser(user_id, {}, client);
    
    // 6. Issue session and tokens.
    issued = await issueSessionWithTokens(
      {
        userId: user_id,
        roleId: role_id,
        ipAddress,
        userAgent,
        deviceId,
        parsedUserAgent,
      },
      client
    );
    
    if (!issued) {
      throw AppError.generalError('Login succeeded but no tokens were issued.');
    }
    
    return transformLoginResponse({
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
      last_login,
    });
  });
  
  // Post-commit audit log — best effort, must not fail the login response.
  try {
    await insertLoginHistory(
      {
        userId,
        sessionId: issued.sessionId,
        tokenId: issued.refreshTokenId,
        authActionTypeId: getStatusId('login_success'),
        status: 'success',
        ipAddress,
        userAgent,
      },
      null
    );
  } catch (logError) {
    logSystemWarn('Post-login audit logging failed', {
      context,
      userId,
      error: logError.message,
    });
  }
  
  return response;
};

/**
 * Validates a refresh token, rotates it, and issues new access and refresh tokens.
 *
 * Revokes the current refresh token on rotation to prevent replay attacks
 * during concurrent refresh attempts.
 *
 * @param {string} refreshToken
 * @param {object} [options={}]
 * @param {string | null} [options.ipAddress=null]
 * @param {string | null} [options.userAgent=null]
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 * @throws {AppError} refreshTokenError – token missing, invalid, expired, or revoked.
 * @throws {AppError} authenticationError – user not found or inactive.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} serviceError – wraps unexpected errors.
 */
const refreshTokenService = async (
  refreshToken,
  { ipAddress = null, userAgent = null } = {}
) => {
  const context = `${CONTEXT}/refreshTokenService`;
  
  if (!refreshToken) {
    throw AppError.refreshTokenError('Refresh token is required. Please log in again.');
  }
  
  // Verify JWT cryptographic validity only — persistence and revocation enforced below.
  const payload = verifyRefreshJwt(refreshToken);
  
  if (!payload?.id || !payload?.sessionId) {
    throw AppError.refreshTokenError('Invalid refresh token payload.');
  }
  
  try {
    return await withTransaction(async (client) => {
      const user = await getAuthUserById(payload.id, client);
      
      if (!user) {
        throw AppError.authenticationError('User not found.');
      }
      
      if (user.status_name !== 'active') {
        throw AppError.authenticationError('User account is inactive.');
      }
      
      // 1. Validate refresh token persistence state (not revoked, not expired).
      const token = await validateRefreshTokenState(refreshToken, {
        ipAddress,
        userAgent,
        client,
      });
      
      // 2. Validate associated session (active, not expired).
      const session = await validateSessionState(token.session_id, client);
      
      // 3. Revoke current refresh token to prevent replay on concurrent requests.
      await revokeTokenById(token.id, client);
      
      await insertTokenActivityLog(
        {
          userId: payload.id,
          tokenId: token.id,
          eventType: 'revoke',
          status: 'success',
          tokenType: 'refresh',
          ipAddress,
          userAgent,
        },
        client
      );
      
      // 4. Issue new access and refresh tokens.
      const newAccessToken = signToken({
        id: payload.id,
        role: user.role_id,
        sessionId: session.id,
      });
      
      const newRefreshToken = signToken(
        {
          id: payload.id,
          sessionId: session.id,
          jti: crypto.randomUUID(),
        },
        true
      );
      
      // 5. Persist new refresh token.
      const refreshTokenHash = hashToken(newRefreshToken);
      
      const newTokenRow = await insertToken(
        {
          userId: payload.id,
          sessionId: session.id,
          tokenType: 'refresh',
          tokenHash: refreshTokenHash,
          expiresAt: getTokenExpiry(true),
          context: 'refresh',
        },
        client
      );
      
      await insertTokenActivityLog(
        {
          userId: payload.id,
          tokenId: newTokenRow.id,
          eventType: 'refresh',
          status: 'success',
          tokenType: 'refresh',
          ipAddress,
          userAgent,
        },
        client
      );
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to refresh token.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Revokes a single session for the authenticated user.
 *
 * Exits early if either `userId` or `sessionId` is absent — nothing to revoke.
 *
 * @param {object} session
 * @param {string} session.userId - Authenticated user ID.
 * @param {string} session.sessionId - Session to revoke.
 * @param {object} request
 * @param {string | null} request.ipAddress - Client IP address.
 * @param {string | null} request.userAgent - Client user-agent string.
 * @returns {Promise<void>}
 * @throws {AppError} Re-throws AppErrors from session lifecycle unchanged.
 * @throws {AppError} serviceError – wraps unexpected errors.
 */
const logoutService = async (
  { userId, sessionId },
  { ipAddress, userAgent }
) => {
  // No active session — nothing to revoke.
  if (!userId || !sessionId) return;
  
  try {
    await withTransaction(async (client) => {
      await logoutSession({ sessionId, ipAddress, userAgent }, client);
    });
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
 *   7. Revoke all active sessions (security boundary).
 *
 * @param {string} userId - Authenticated user ID.
 * @param {string} currentPassword - The user's current plaintext password.
 * @param {string} newPassword - The desired new plaintext password.
 * @returns {Promise<void>}
 * @throws {AppError} authenticationError – current password does not match.
 * @throws {AppError} validationError – new password fails strength or reuse check.
 * @throws {AppError} notFoundError – auth record missing after lock.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} serviceError – wraps unexpected errors.
 */
const changePasswordService = async (userId, currentPassword, newPassword) => {
  const context = `${CONTEXT}/changePasswordService`;
  
  try {
    return await withTransaction(async (client) => {
      // 1. Fetch and lock auth record (single source of truth).
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
      
      // 6. Persist password and history atomically.
      const result = await updatePasswordAndHistory(
        authId,
        newPasswordHash,
        updatedHistory,
        client
      );
      
      if (!result) {
        throw AppError.notFoundError('Authentication record not found.');
      }
      
      // 7. Revoke all active sessions — new password invalidates all existing tokens.
      await revokeAllSessionsForUser(userId, {}, client);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to complete password change.', {
      meta: { error: error.message },
    });
  }
};

module.exports = {
  loginUserService,
  refreshTokenService,
  logoutService,
  changePasswordService,
};
