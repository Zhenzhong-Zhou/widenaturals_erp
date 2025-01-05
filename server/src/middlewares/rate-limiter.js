/**
 * @file rate-limiters.js
 * @description Factory functions for creating specific rate limiters using the `createRateLimiter` utility.
 */

const { createRateLimiter } = require('../utils/rate-limit-helper');
const RATE_LIMIT = require('../utils/constants/domain/rate-limit');

/**
 * Creates a global rate limiter applied to all routes.
 * Prevents abuse across the entire application.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createGlobalRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.GLOBAL.WINDOW_MS,
    max: RATE_LIMIT.GLOBAL.MAX,
    message: RATE_LIMIT.GLOBAL.MESSAGE,
  });

/**
 * Creates an API-specific rate limiter for `/api` routes.
 * Provides fine-grained control over API traffic.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createApiRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.API.WINDOW_MS,
    max: RATE_LIMIT.API.MAX,
    message: RATE_LIMIT.API.MESSAGE,
  });

/**
 * Creates a login-specific rate limiter to limit login attempts.
 * Protects against brute-force login attacks.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createLoginRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.LOGIN.WINDOW_MS,
    max: RATE_LIMIT.LOGIN.MAX,
    message: RATE_LIMIT.LOGIN.MESSAGE,
  });

/**
 * Creates an authentication-specific rate limiter.
 * Ensures authentication actions are rate-limited.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createAuthenticationRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.AUTHENTICATION.WINDOW_MS,
    max: RATE_LIMIT.AUTHENTICATION.MAX,
    message: RATE_LIMIT.AUTHENTICATION.MESSAGE,
  });

/**
 * Creates an authorization-specific rate limiter.
 * Ensures authorization-related requests are rate-limited.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createAuthorizationRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.AUTHORIZATION.WINDOW_MS,
    max: RATE_LIMIT.AUTHORIZATION.MAX,
    message: RATE_LIMIT.AUTHORIZATION.MESSAGE,
  });

/**
 * Creates a password reset rate limiter to limit reset attempts.
 * Protects against abuse of password reset functionality.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createPasswordResetRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.PASSWORD_RESET.WINDOW_MS,
    max: RATE_LIMIT.PASSWORD_RESET.MAX,
    message: RATE_LIMIT.PASSWORD_RESET.MESSAGE,
  });

/**
 * Creates a signup-specific rate limiter to limit signup attempts.
 * Prevents abuse of user registration.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createSignupRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.SIGNUP.WINDOW_MS,
    max: RATE_LIMIT.SIGNUP.MAX,
    message: RATE_LIMIT.SIGNUP.MESSAGE,
  });

/**
 * Creates an admin-specific rate limiter for admin routes.
 * Protects critical admin functionalities from overuse or abuse.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createAdminRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.ADMIN.WINDOW_MS,
    max: RATE_LIMIT.ADMIN.MAX,
    message: RATE_LIMIT.ADMIN.MESSAGE,
  });

/**
 * Creates a file upload-specific rate limiter to control file uploads.
 * Prevents overuse of upload functionality.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createFileUploadRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.FILE_UPLOAD.WINDOW_MS,
    max: RATE_LIMIT.FILE_UPLOAD.MAX,
    message: RATE_LIMIT.FILE_UPLOAD.MESSAGE,
  });

/**
 * Creates a rate limiter for "forgot username" requests.
 * Prevents abuse of the "forgot username" functionality.
 *
 * @returns {Function} Express middleware for rate limiting.
 */
const createForgotUsernameRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.FORGOT_USERNAME.WINDOW_MS,
    max: RATE_LIMIT.FORGOT_USERNAME.MAX,
    message: RATE_LIMIT.FORGOT_USERNAME.MESSAGE,
  });

module.exports = {
  createGlobalRateLimiter,
  createApiRateLimiter,
  createLoginRateLimiter,
  createAuthenticationRateLimiter,
  createAuthorizationRateLimiter,
  createPasswordResetRateLimiter,
  createSignupRateLimiter,
  createAdminRateLimiter,
  createFileUploadRateLimiter,
  createForgotUsernameRateLimiter,
};
