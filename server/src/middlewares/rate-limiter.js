/**
 * @file rate-limiter.js
 * @description Factory functions for creating route-specific rate limiter
 * middleware instances.
 *
 * Each factory returns a configured `express-rate-limit` middleware instance
 * by delegating to `createRateLimiter` with route-specific limits sourced
 * from the `RATE_LIMIT` constants.
 *
 * Usage:
 *   Call each factory once at route/app setup time — not inside request
 *   handlers. Calling inside a handler creates a new limiter instance per
 *   request, which resets the counter on every call and defeats the purpose.
 *
 * @example
 * // Correct — called once at route definition time
 * router.post('/login', createLoginRateLimiter(), loginController);
 *
 * // Wrong — called inside a handler, new instance every request
 * router.post('/login', (req, res, next) => {
 *   createLoginRateLimiter()(req, res, next); // resets counter each request
 * });
 */

'use strict';

const { createRateLimiter } = require('../utils/rate-limit-helper');
const RATE_LIMIT = require('../utils/constants/domain/rate-limit');

/**
 * Creates the global rate limiter applied across all routes.
 *
 * Disabled in development (`disableInDev: true`) so that local testing and
 * tooling are not affected by request limits.
 *
 * Applied in `app.js` before any route is registered.
 *
 * @returns {import('express').RequestHandler}
 */
const createGlobalRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.GLOBAL.WINDOW_MS,
    max: RATE_LIMIT.GLOBAL.MAX,
    context: 'global-rate-limiter',
    disableInDev: true,
  });

/**
 * Creates a rate limiter for general API routes mounted under `/api`.
 *
 * Broader window and higher limit than auth-specific limiters — intended to
 * catch bulk scraping or runaway clients rather than brute-force attempts.
 *
 * @returns {import('express').RequestHandler}
 */
const createApiRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.API.WINDOW_MS,
    max: RATE_LIMIT.API.MAX,
    context: 'api-rate-limiter',
  });

/**
 * Creates a rate limiter for the CSRF token endpoint.
 *
 * Tightly limited to prevent token farming — clients should only need a
 * token once per session, not on every request.
 *
 * @returns {import('express').RequestHandler}
 */
const createCsrfTokenRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.CSRF.WINDOW_MS,
    max: RATE_LIMIT.CSRF.MAX,
    context: 'csrf-token-rate-limiter',
  });

/**
 * Creates a rate limiter for the public health check endpoint.
 *
 * Allows frequent polling by load balancers and uptime monitors while
 * still preventing accidental denial-of-service during deployments or
 * misconfigured polling loops.
 *
 * @returns {import('express').RequestHandler}
 */
const createHealthRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.HEALTH.WINDOW_MS,
    max: RATE_LIMIT.HEALTH.MAX,
    context: 'health-rate-limiter',
  });

/**
 * Creates a rate limiter for the login endpoint.
 *
 * Intentionally strict — limits brute-force credential attacks.
 * Should have a short window and low max relative to other limiters.
 *
 * @returns {import('express').RequestHandler}
 */
const createLoginRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.LOGIN.WINDOW_MS,
    max: RATE_LIMIT.LOGIN.MAX,
    context: 'login-rate-limiter',
  });

/**
 * Creates a rate limiter for the refresh token endpoint.
 *
 * Prevents token refresh loops and limits the blast radius if a refresh
 * token is compromised and used repeatedly before revocation.
 *
 * @returns {import('express').RequestHandler}
 */
const createRefreshRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.REFRESH.WINDOW_MS,
    max: RATE_LIMIT.REFRESH.MAX,
    context: 'refresh-token-rate-limiter',
  });

/**
 * Creates a rate limiter for user profile update actions.
 *
 * Moderate limit — prevents automated profile scraping or bulk update
 * attempts while not impeding normal user activity.
 *
 * @returns {import('express').RequestHandler}
 */
const createUserProfileRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.USER_PROFILE.WINDOW_MS,
    max: RATE_LIMIT.USER_PROFILE.MAX,
    context: 'user-profile-rate-limiter',
  });

/**
 * Creates a rate limiter for password reset requests.
 *
 * Strictly limited to prevent email flooding and enumeration attacks
 * via the reset flow.
 *
 * @returns {import('express').RequestHandler}
 */
const createResetPasswordRateLimiter = () =>
  createRateLimiter({
    windowMs: RATE_LIMIT.PASSWORD_RESET.WINDOW_MS,
    max: RATE_LIMIT.PASSWORD_RESET.MAX,
    context: 'reset-password-rate-limiter',
  });

/**
 * Creates a rate limiter for admin-protected routes.
 *
 * Lower limit than standard API routes — admin endpoints carry higher
 * risk if abused and should be accessed only by trusted internal tooling.
 *
 * @returns {import('express').RequestHandler}
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
