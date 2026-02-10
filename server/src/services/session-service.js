const { withTransaction } = require('../database/db');
const { getStatusId } = require('../config/status-cache');
const AppError = require('../utils/AppError');
const {
  getAndLockUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
} = require('../repositories/user-auth-repository');
const { verifyPassword } = require('../business/user-auth-business');
const { logSystemWarn, logSystemInfo } = require('../utils/system-logger');
const { signToken, verifyToken } = require('../utils/auth/jwt-utils');
const { transformLoginResponse } = require('../transformers/session-transformer');
const { issueSessionWithTokens, revokeAllSessionsForUser } = require('../business/auth/session-lifecycle');
const { insertLoginHistory } = require('../repositories/login-history-repository');
const { insertTokenActivityLog } = require('../repositories/token-activity-log-repository');

/**
 * Authenticates a user using email and password.
 *
 * Guarantees:
 * - All authentication state mutations occur within a single database transaction
 * - Enforces a single-session policy (previous sessions and tokens are revoked)
 * - Returns a finalized, API-ready response on success
 * - Throws on authentication or validation failure
 * - Audit logging is best-effort and never affects control flow
 *
 * Authentication model:
 * - Password-based authentication only
 * - Latest successful login invalidates all prior sessions and refresh tokens
 * - Access tokens are short-lived and stateless; refresh tokens are stateful
 *
 * Security properties:
 * - Does NOT leak user existence or account status
 * - Does NOT expose session or token identifiers to callers
 ugerAgent
 * - Does NOT persist raw tokens (hashes only)
 *
 * Notes:
 * - `deviceId` and `note` are optional metadata for auditing and future policy enforcement
 * - Session and token lifecycle management is handled internally
 *
 * @param {string} email
 * @param {string} password
 * @param {Object} context
 * @param {string|null} context.ipAddress  - Client IP address (optional)
 * @param {string|null} context.userAgent  - Client user agent (optional)
 * @param {string|null} context.deviceId   - Client device identifier (optional)
 * @param {string|null} context.note       - Optional audit note
 *
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string,
 *   lastLogin: string | null
 * }>}
 *
 * @throws {AppError}
 * - authenticationError   (invalid credentials)
 * - accountLockedError    (lockout enforced)
 * - validationError       (invalid input or state)
 * - generalError          (unexpected failures)
 */
const loginUserService = async (
  email,
  password,
  {
    ipAddress = null,
    userAgent = null,
    deviceId = null,
    note = null,
  } = {}
) => {
  const context = 'auth-service/loginUserService';
  
  let issued;     // used for post-commit logging
  let userId;     // used for post-commit logging
  
  // ------------------------------------------------------------
  // Transactional auth flow
  // ------------------------------------------------------------
  const response = await withTransaction(async (client) => {
    const activeStatusId = getStatusId('general_active');
    if (!activeStatusId) {
      throw AppError.validationError('Active status ID is required.');
    }
    
    // 1. Fetch & lock auth record
    const auth = await getAndLockUserAuthByEmail(
      email,
      activeStatusId,
      client
    );
    
    if (!auth) {
      // Do NOT reveal whether email exists or account is inactive
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
    
    // 2. Lockout check
    if (lockout_time && new Date(lockout_time) > new Date()) {
      throw AppError.accountLockedError(
        'Account locked. Try again later.',
        { lockoutEndsAt: lockout_time }
      );
    }
    
    // 3. Verify password
    if (!password_hash) {
      throw AppError.serviceError('Authentication state is invalid.');
    }
    
    const isValidPassword = await verifyPassword(password_hash, password);
    const newTotalAttempts = attempts + 1;
    
    if (!isValidPassword) {
      await incrementFailedAttempts(
        auth_id,
        newTotalAttempts,
        failed_attempts,
        client
      );
      throw AppError.authenticationError('Invalid email or password.');
    }
    
    // 4. Successful login bookkeeping
    await resetFailedAttemptsAndUpdateLastLogin(
      auth_id,
      newTotalAttempts,
      client
    );
    
    // Enforce single-session policy: revoke all existing sessions and refresh tokens
    await revokeAllSessionsForUser(user_id, client);
    
    // 5. Issue session + tokens
    issued = await issueSessionWithTokens(
      {
        userId: user_id,
        roleId: role_id,
        ipAddress,
        userAgent,
        deviceId,
        note,
      },
      client
    );
    
    if (!issued) {
      throw AppError.generalError('Login succeeded but no tokens were issued.');
    }
    
    // 6. Return finalized response
    return transformLoginResponse({
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
      last_login,
    });
  });
  
  // ------------------------------------------------------------
  // Post-commit audit logging (best effort)
  // ------------------------------------------------------------
  try {
    const loginSuccessActionId = getStatusId('login_success');
    
    await insertLoginHistory({
      userId,
      sessionId: issued.sessionId,
      tokenId: issued.accessTokenId,
      authActionTypeId: loginSuccessActionId,
      status: 'success',
      ipAddress,
      userAgent,
    }, null);
    
    await insertTokenActivityLog({
      userId,
      tokenId: issued.accessTokenId,
      eventType: 'generate',
      status: 'success',
      tokenType: 'access',
      ipAddress,
      userAgent,
    }, null);
    
    await insertTokenActivityLog({
      userId,
      tokenId: issued.refreshTokenId,
      eventType: 'generate',
      status: 'success',
      tokenType: 'refresh',
      ipAddress,
      userAgent,
    }, null);
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
 * Refreshes authentication tokens using a valid refresh token.
 *
 * This service represents the domain-level refresh operation. It is responsible
 * for validating the provided refresh token, rotating it, and issuing a new
 * access token. All token semantics and error conditions are enforced here,
 * not at the controller layer.
 *
 * Responsibilities:
 * - Assert presence of a refresh token
 * - Cryptographically verify the refresh token
 * - Translate token verification failures into domain-specific auth errors
 * - Rotate the refresh token
 * - Issue a new access token
 * - Emit structured audit / security logs
 *
 * Security model:
 * - This service does NOT depend on access-token authentication.
 * - Missing, expired, or invalid refresh tokens are treated as expected
 *   authentication failures and surfaced as domain errors.
 * - Logging is intentional and represents successful token rotation only.
 *
 * Notes:
 * - This operation is idempotent with respect to client behavior; callers
 *   may safely retry as needed.
 * - HTTP concerns (cookies, headers, status codes) are handled by controllers.
 *
 * @param {string | undefined | null} refreshToken
 *   Refresh token extracted from an HTTP-only cookie.
 *
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 *   Newly issued access token and rotated refresh token.
 *
 * @throws {AppError}
 *   - refreshTokenError: refresh token missing
 *   - refreshTokenExpiredError: refresh token expired
 *   - tokenRevokedError: refresh token invalid
 */
const refreshTokenService = async (refreshToken) => {
  const context = 'auth-service/refreshTokenService';
  
  // Refresh token presence is a domain requirement, not an HTTP concern
  if (!refreshToken) {
    throw AppError.refreshTokenError(
      'Refresh token is required. Please log in again.',
      { logLevel: 'warn' }
    );
  }
  
  let payload;
  
  // Verify refresh token and map low-level token errors to domain errors
  try {
    payload = verifyToken(refreshToken, true);
  } catch (error) {
    if (error.name === 'RefreshTokenExpiredError') {
      throw AppError.refreshTokenExpiredError(
        'Refresh token expired. Please log in again.'
      );
    }
    
    if (error.name === 'JsonWebTokenError') {
      throw AppError.tokenRevokedError(
        'Invalid refresh token. Please log in again.'
      );
    }
    
    // Unexpected verification failure — allow centralized error handling
    throw error;
  }
  
  // Rotate refresh token and issue a new access token
  const newRefreshToken = signToken(
    { id: payload.id, role: payload.role },
    true
  );
  
  const newAccessToken = signToken({
    id: payload.id,
    role: payload.role,
  });
  
  // Successful rotation is a security-relevant event worth auditing
  logSystemInfo('Refresh token rotated', {
    context,
    userId: payload.id,
  });
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

module.exports = {
  loginUserService,
  refreshTokenService,
};
