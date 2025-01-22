const { createRateLimiter } = require('../utils/rate-limit-helper');
const RATE_LIMIT = require('../utils/constants/domain/rate-limit');

/**
 * Creates a global rate limiter applied to all routes.
 */
const createGlobalRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.GLOBAL.WINDOW_MS,
    max: RATE_LIMIT.GLOBAL.MAX,
  });

/**
 * Creates an API-specific rate limiter for `/api` routes.
 */
const createApiRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.API.WINDOW_MS,
    max: RATE_LIMIT.API.MAX,
  });

// CSRF Token Route Rate Limiter
const createCsrfTokenRateLimiter = () =>
  createRateLimiter({
  windowMs: RATE_LIMIT.CSRF.WINDOW_MS,
  max: RATE_LIMIT.CSRF.MAX,
});

/**
 * Creates a login-specific rate limiter to limit login attempts.
 */
const createLoginRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.LOGIN.WINDOW_MS,
    max: RATE_LIMIT.LOGIN.MAX,
  });

// Refresh Token Route Rate Limiter
const createRefreshRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.REFRESH.WINDOW_MS,
    max: RATE_LIMIT.REFRESH.MAX,
});

// User Profile Route Rate Limiter
const createUserProfileRateLimiter = () =>
  createRateLimiter({
  windowMs: RATE_LIMIT.USER_PROFILE.WINDOW_MS,
  max: RATE_LIMIT.USER_PROFILE.MAX,
});

// Reset Password Route Rate Limiter
const createResetPasswordRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.PASSWORD_RESET.WINDOW_MS,
    max: RATE_LIMIT.PASSWORD_RESET.MAX,
});

/**
 * Creates an admin-specific rate limiter for admin routes.
 */
const createAdminRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.ADMIN.WINDOW_MS,
    max: RATE_LIMIT.ADMIN.MAX,
  });

module.exports = {
  createGlobalRateLimiter,
  createApiRateLimiter,
  createCsrfTokenRateLimiter,
  createLoginRateLimiter,
  createRefreshRateLimiter,
  createUserProfileRateLimiter,
  createResetPasswordRateLimiter,
  createAdminRateLimiter,
};
