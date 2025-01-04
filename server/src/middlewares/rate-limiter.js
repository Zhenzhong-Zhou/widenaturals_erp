/**
 * @file rateLimiter.js
 * @description Middleware for rate limiting to prevent abuse and DDoS attacks.
 */

const rateLimit = require('express-rate-limit');
const { logWarn } = require('../utils/loggerHelper'); // Assuming loggerHelper is implemented

/**
 * Configures and returns a rate-limiting middleware instance.
 *
 * @param {Object} options - Customization options for rate limiting.
 * @param {number} options.windowMs - Time window in milliseconds for rate limiting.
 * @param {number} options.max - Maximum number of requests allowed in the time window.
 * @param {string} [options.message] - Message returned when rate limit is exceeded.
 * @returns {Function} - The configured rate-limiting middleware.
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please try again later.',
  } = options;
  
  return rateLimit({
    windowMs,
    max,
    message,
    handler: (req, res, next, options) => {
      const clientIp = req.ip || req.connection.remoteAddress;
      logWarn(`Rate limit exceeded: ${clientIp}`);
      res.status(429).json({ error: options.message });
    },
    onLimitReached: (req, res, options) => {
      const clientIp = req.ip || req.connection.remoteAddress;
      logWarn(`Rate limit reached for IP: ${clientIp}`);
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

/**
 * Factory functions for preconfigured rate limiters.
 */

const createGlobalRateLimiter = () =>
  createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS, 10), // Default: 15 minutes
    max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10),           // Default: 200 requests
    message: process.env.RATE_LIMIT_GLOBAL_MESSAGE || 'Too many requests. Please try again later.',
  });

const createApiRateLimiter = () =>
  createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS, 10), // Default: 1 minute
    max: parseInt(process.env.RATE_LIMIT_API_MAX, 10),           // Default: 50 API requests
    message: process.env.RATE_LIMIT_API_MESSAGE || 'API rate limit exceeded. Please try again later.',
  });

const authenticationRateLimiter = () => {
  createRateLimiter( {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTHENTICATION_WINDOW_MS, 10),
    max: parseInt(process.env.RATE_LIMIT_AUTHENTICATION_MAX, 10),
    message: process.env.RATE_LIMIT_AUTHENTICATION_MESSAGE || 'Too many login attempts. Please try again later.',
  });
}

const authorizationRateLimiter = () => {
  createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTHORIZATION_WINDOW_MS, 10),
    max: parseInt(process.env.RATE_LIMIT_AUTHORIZATION_MAX, 10),
    message: process.env.RATE_LIMIT_AUTHORIZATION_MESSAGE || 'Too many authorization requests. Please wait.',
  });
}

const createLoginRateLimiter = () =>
  createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10), // Default: 5 minutes
    max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10),           // Default: 10 login attempts
    message: process.env.RATE_LIMIT_LOGIN_MESSAGE || 'Too many login attempts. Please try again later.',
  });

const createPasswordResetRateLimiter = () =>
  createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS, 10), // Default: 10 minutes
    max: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_MAX, 10),           // Default: 5 password reset requests
    message: process.env.RATE_LIMIT_PASSWORD_RESET_MESSAGE || 'Too many password reset requests. Please try again later.',
  });

const createSignupRateLimiter = () =>
  createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_SIGNUP_WINDOW_MS, 10), // Default: 10 minutes
    max: parseInt(process.env.RATE_LIMIT_SIGNUP_MAX, 10),           // Default: 5 signup attempts
    message: process.env.RATE_LIMIT_SIGNUP_MESSAGE || 'Too many signup attempts. Please try again later.',
  });

const createAdminRateLimiter = () =>
  createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS, 10), // Default: 5 minutes
    max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX, 10),           // Default: 20 admin requests
    message: process.env.RATE_LIMIT_ADMIN_MESSAGE || 'Too many admin requests. Please try again later.',
  });

const createFileUploadRateLimiter = () =>
  createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_FILE_UPLOAD_WINDOW_MS, 10), // Default: 10 minutes
    max: parseInt(process.env.RATE_LIMIT_FILE_UPLOAD_MAX, 10),           // Default: 10 file uploads
    message: process.env.RATE_LIMIT_FILE_UPLOAD_MESSAGE || 'Too many file upload requests. Please try again later.',
  });

const createForgotUsernameRateLimiter = () =>
  createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_FORGOT_USERNAME_WINDOW_MS, 10), // Default: 10 minutes
    max: parseInt(process.env.RATE_LIMIT_FORGOT_USERNAME_MAX, 10),           // Default: 5 requests
    message: process.env.RATE_LIMIT_FORGOT_USERNAME_MESSAGE || 'Too many forgot username requests. Please try again later.',
  });

module.exports = {
  createRateLimiter,
  createGlobalRateLimiter,
  createApiRateLimiter,
  authenticationRateLimiter,
  authorizationRateLimiter,
  createLoginRateLimiter,
  createPasswordResetRateLimiter,
  createSignupRateLimiter,
  createAdminRateLimiter,
  createFileUploadRateLimiter,
  createForgotUsernameRateLimiter,
};
