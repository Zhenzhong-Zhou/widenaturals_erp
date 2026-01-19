const { withTransaction } = require('../database/db');
const { getStatusId } = require('../config/status-cache');
const AppError = require('../utils/AppError');
const {
  getAndLockUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
} = require('../repositories/user-auth-repository');
const { verifyPassword } = require('../business/user-auth-business');
const { logSystemException, logSystemWarn, logSystemInfo } = require('../utils/system-logger');
const { signToken, verifyToken } = require('../utils/token-helper');
const { transformLoginResponse } = require('../transformers/session-transformer');

/**
 * Authenticates a user using email and password.
 *
 * This service performs a complete, transactional login flow with
 * concurrency safety and security hardening.
 *
 * Responsibilities:
 * - Fetch and lock the user authentication record
 * - Validate account status and enforce lockout rules
 * - Verify credentials without leaking user existence
 * - Update login attempt counters (success or failure)
 * - Record successful login metadata
 * - Issue access and refresh tokens
 * - Normalize and validate the authentication result
 *
 * Architectural guarantees:
 * - All authentication state mutations occur within a single transaction
 * - Returned data is API-ready and controller-safe
 * - Persistence-layer naming and formatting are fully encapsulated
 *
 * Controllers MUST:
 * - Treat the returned object as final
 * - NOT rename, format, or interpret authentication fields
 *
 * @param {string} email
 * @param {string} password
 *
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string,
 *   lastLogin: string | null
 * }>}
 */
const loginUserService = async (email, password) => {
  const context = 'auth-service/loginUserService';
  
  return withTransaction(async (client) => {
    try {
      const activeStatusId = getStatusId('general_active');
      
      if (!activeStatusId) {
        throw AppError.validationError('Active status ID is required.');
      }
      
      // ------------------------------------------------------------
      // 1. Fetch & lock auth record (single source of truth)
      // ------------------------------------------------------------
      const auth = await getAndLockUserAuthByEmail(
        email,
        activeStatusId,
        client
      );
      
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
      
      // ------------------------------------------------------------
      // 2. Lockout check
      // ------------------------------------------------------------
      if (lockout_time && new Date(lockout_time) > new Date()) {
        throw AppError.accountLockedError(
          'Account locked. Try again later.',
          { lockoutEndsAt: lockout_time }
        );
      }
      
      // ------------------------------------------------------------
      // 3. Verify password
      // ------------------------------------------------------------
      const isValidPassword = await verifyPassword(
        password_hash,
        password
      );
      
      const newTotalAttempts = attempts + 1;
      
      if (!isValidPassword) {
        logSystemWarn('Login failed: invalid credentials', {
          context,
          email,
        });
        
        await incrementFailedAttempts(
          auth_id,
          newTotalAttempts,
          failed_attempts,
          client
        );
        
        throw AppError.authenticationError('Invalid email or password.');
      }
      
      // ------------------------------------------------------------
      // 4. Successful login bookkeeping
      // ------------------------------------------------------------
      await resetFailedAttemptsAndUpdateLastLogin(
        auth_id,
        newTotalAttempts,
        client
      );
      
      // ------------------------------------------------------------
      // 5. Issue tokens
      // ------------------------------------------------------------
      const accessToken = signToken({ id: user_id, role: role_id });
      const refreshToken = signToken(
        { id: user_id, role: role_id },
        true
      );
      
      // ------------------------------------------------------------
      // 6. Normalize service result (controller-ready)
      // ------------------------------------------------------------
      return transformLoginResponse({
        accessToken,
        refreshToken,
        last_login,
      });
    } catch (error) {
      if (!error.isExpected) {
        logSystemException(error, 'Unexpected login failure', {
          context,
          email,
          error: error.message,
        });
      }
      
      throw error instanceof AppError
        ? error
        : AppError.generalError('Login failed.');
    }
  });
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
