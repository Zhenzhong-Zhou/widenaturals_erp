const { createRateLimiter } = require('../utils/rate-limit-helper');
const RATE_LIMIT = require('../utils/constants/domain/rate-limit');

/**
 * Creates a global rate limiter applied to all routes.
 */
const createGlobalRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.GLOBAL.WINDOW_MS,
    max: RATE_LIMIT.GLOBAL.MAX,
    context: 'global-rate-limiter',
    disableInDev: true,
  });

/**
 * Creates a rate limiter for general API routes (`/api`).
 */
const createApiRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.API.WINDOW_MS,
    max: RATE_LIMIT.API.MAX,
    context: 'api-rate-limiter',
  });

/**
 * Creates a rate limiter for the CSRF token endpoint.
 */
const createCsrfTokenRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.CSRF.WINDOW_MS,
    max: RATE_LIMIT.CSRF.MAX,
    context: 'csrf-token-rate-limiter',
  });

/**
 * Creates a rate limiter to control public health check requests.
 *
 * Purpose:
 * - Protects the health endpoint from abuse
 * - Allows frequent polling by load balancers and monitors
 * - Prevents accidental denial of service during deployments
 */
const createHealthRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.HEALTH.WINDOW_MS,
    max: RATE_LIMIT.HEALTH.MAX,
    context: 'health-rate-limiter',
  });

/**
 * Creates a rate limiter to control login attempts.
 */
const createLoginRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.LOGIN.WINDOW_MS,
    max: RATE_LIMIT.LOGIN.MAX,
    context: 'login-rate-limiter',
  });

/**
 * Creates a rate limiter for the refresh token endpoint.
 */
const createRefreshRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.REFRESH.WINDOW_MS,
    max: RATE_LIMIT.REFRESH.MAX,
    context: 'refresh-token-rate-limiter',
  });

/**
 * Creates a rate limiter for user profile actions (e.g. updates).
 */
const createUserProfileRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.USER_PROFILE.WINDOW_MS,
    max: RATE_LIMIT.USER_PROFILE.MAX,
    context: 'user-profile-rate-limiter',
  });

/**
 * Creates a rate limiter for password reset requests.
 */
const createResetPasswordRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.PASSWORD_RESET.WINDOW_MS,
    max: RATE_LIMIT.PASSWORD_RESET.MAX,
    context: 'reset-password-rate-limiter',
  });

/**
 * Creates a rate limiter for admin-protected routes.
 */
const createAdminRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.ADMIN.WINDOW_MS,
    max: RATE_LIMIT.ADMIN.MAX,
    context: 'admin-rate-limiter',
  });

module.exports = {
  createGlobalRateLimiter,
  createApiRateLimiter,
  createCsrfTokenRateLimiter,
  createHealthRateLimiter,
  createLoginRateLimiter,
  createRefreshRateLimiter,
  createUserProfileRateLimiter,
  createResetPasswordRateLimiter,
  createAdminRateLimiter,
};
